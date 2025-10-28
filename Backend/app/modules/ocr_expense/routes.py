"""
Simplified OCR Expense Routes - Option 2 Implementation.
Only 1 endpoint: POST /api/v1/ocr/expense:extract (synchronous)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.middleware import get_current_user
from app.modules.users.service import User
from app.modules.ocr_expense.exceptions import (
    OcrExpenseException, FileValidationError, UnsupportedMediaTypeError,
    SchemaViolationError, InternalError
)
from app.modules.ocr_expense.service import ocr_expense_service
from app.modules.ocr_expense.schemas import (
    OcrExpenseHints, OcrExpenseResult, OcrExpenseJobResponse, OcrExpenseExtractRequest
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["ocr-expense"])


@router.post(
    "/expense:extract",
    response_model=OcrExpenseJobResponse,
    summary="OcrExtract",
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "title": "OcrExpenseExtractRequest",
                        "type": "object",
                        "required": ["file", "session_id", "user_id"],
                        "properties": {
                            "file": {"type": "string", "format": "binary", "title": "File"},
                            "session_id": {"type": "string", "title": "Session Id"},
                            "user_id": {"type": "string", "title": "User Id"},
                            "hints": {"anyOf": [{"type": "string"}, {"type": "null"}], "title": "Hints"},
                            "debug": {"type": "boolean", "title": "Debug", "default": False}
                        }
                    }
                }
            }
        }
    }
)
async def extract_expense_sync(
    req: OcrExpenseExtractRequest = Depends(OcrExpenseExtractRequest.as_form),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> OcrExpenseJobResponse:
    """
    Extract expense data from uploaded file (synchronous).
    
    Args:
        session_id: Chat session ID
        user_id: User ID
        file: Image or PDF file
        hints: Optional hints as JSON string
        debug: Include debug information
        db: Database session
        
    Returns:
        OCR result with session context
    """
    try:
        # Parse hints if provided
        parsed_hints = None
        if req.hints:
            try:
                import json
                hints_dict = json.loads(req.hints)
                parsed_hints = OcrExpenseHints(**hints_dict)
            except Exception as e:
                raise FileValidationError(f"Invalid hints format: {str(e)}")
        
        # Ensure debug flag carried into hints for response enrichment
        if parsed_hints is None:
            parsed_hints = OcrExpenseHints()
        # if client sent debug form flag, honor it (don't overwrite true)
        parsed_hints.debug = parsed_hints.debug or bool(req.debug)

        # Process OCR synchronously
        result = await ocr_expense_service.extract_expense_sync(
            db=db,
            session_id=req.session_id,
            user_id=req.user_id,
            file=file,
            hints=parsed_hints,
            profile="generic"
        )
        
        return result
        
    except OcrExpenseException:
        raise
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        raise InternalError(f"OCR extraction failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint for OCR service."""
    return {
        "status": "ok",
        "service": "ocr-expense",
        "gemini_available": True  # TODO: Check Gemini availability
    }


@router.post(
    "/mark-saved/{job_id}",
    summary="Mark OCR as saved to transactions"
)
async def mark_ocr_saved(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark OCR job as saved to transactions.
    
    Args:
        job_id: OCR job ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        from app.modules.ocr_expense.models import OcrExpenseJob
        from sqlalchemy import select, update
        
        # Check if job exists and belongs to user
        stmt = select(OcrExpenseJob).where(
            OcrExpenseJob.id == job_id,
            OcrExpenseJob.user_id == current_user.id
        )
        result = await db.execute(stmt)
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail="OCR job not found")
        
        # Update saved_to_transactions flag
        update_stmt = (
            update(OcrExpenseJob)
            .where(OcrExpenseJob.id == job_id)
            .values(saved_to_transactions=True)
        )
        await db.execute(update_stmt)
        await db.commit()
        
        return {"message": "OCR job marked as saved to transactions"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark OCR as saved: {e}")
        raise InternalError(f"Failed to mark OCR as saved: {str(e)}")


@router.get(
    "/history",
    summary="Get OCR History",
    response_model=list[dict]
)
async def get_ocr_history(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get OCR history for a user.
    
    Args:
        user_id: User ID to get history for
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of OCR jobs with results
    """
    try:
        # Query OCR jobs for the user
        from app.modules.ocr_expense.models import OcrExpenseJob, OcrExpenseResult
        from sqlalchemy import select
        
        stmt = (
            select(OcrExpenseJob, OcrExpenseResult)
            .outerjoin(OcrExpenseResult, OcrExpenseJob.id == OcrExpenseResult.job_id)
            .where(OcrExpenseJob.user_id == user_id)
            .order_by(OcrExpenseJob.created_at.desc())
            .limit(50)
        )
        
        result = await db.execute(stmt)
        rows = result.all()
        
        history = []
        for job, ocr_result in rows:
            item = {
                "id": job.id,
                "session_id": job.session_id,
                "user_id": job.user_id,
                "original_filename": job.original_filename,
                "status": job.status,
                "saved_to_transactions": job.saved_to_transactions,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            }
            
            # Add OCR result if available
            if ocr_result:
                item["result"] = {
                    "transaction_date": ocr_result.transaction_date,
                    "amount": {
                        "value": ocr_result.amount_value,
                        "currency": ocr_result.amount_currency
                    },
                    "category": {
                        "code": ocr_result.category_code,
                        "name": ocr_result.category_name
                    },
                    "items": ocr_result.items_json or [],
                    "meta": ocr_result.meta_json or {}
                }
            
            history.append(item)
        
        return history
        
    except Exception as e:
        logger.error(f"Failed to get OCR history: {e}")
        raise InternalError(f"Failed to get OCR history: {str(e)}")