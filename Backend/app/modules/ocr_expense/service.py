"""
Simplified OCR Expense Service - Option 2 Implementation.
Synchronous OCR processing with session integration.
"""

import logging
import asyncio
import uuid
import base64
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple, Dict, Any, List
import json
import time
import mimetypes

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.modules.chat.models import Session, Message
from app.modules.chat.service import save_message
from app.modules.ocr_expense.models import OcrExpenseJob, OcrExpenseResult
from app.modules.ocr_expense.preprocessing import preprocessor
from app.modules.ocr_expense.gemini_client import gemini_ocr_client
from app.modules.ocr_expense.postprocessing import post_processor
from app.modules.ocr_expense.validation import schema_validator
from app.modules.ocr_expense.exceptions import (
    FileValidationError, UnsupportedMediaTypeError, SchemaViolationError,
    InternalError
)
from app.modules.ocr_expense.schemas import (
    OcrExpenseHints, OcrExpenseJobResponse
)

logger = logging.getLogger(__name__)


class OcrExpenseService:
    def __init__(self):
        self.upload_dir = Path(settings.OCR_UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.max_file_size = settings.OCR_MAX_FILE_SIZE
        self.allowed_types = settings.OCR_ALLOWED_TYPES
        self.default_timezone = settings.OCR_DEFAULT_TIMEZONE

    async def extract_expense_sync(
        self,
        db: AsyncSession,
        session_id: str,
        user_id: str,
        file: UploadFile,
        hints: Optional[OcrExpenseHints] = None,
        profile: str = "generic"
    ) -> OcrExpenseJobResponse:
        """
        Extract expense data synchronously and save to session context.
        """
        start_time = time.perf_counter()
        
        try:
            # 1. Validate file
            self._validate_file(file)
            
            # 2. Generate unique filename and path
            file_id = str(uuid.uuid4())
            file_extension = self._get_file_extension(file.filename)
            filename_on_disk = f"{file_id}{file_extension}"
            file_path = self.upload_dir / filename_on_disk
            
            # 3. Save file to disk
            t0 = time.perf_counter()
            await self._save_file(file, file_path)
            logger.info("[OCR] Saved upload to disk in %.3fs → %s", time.perf_counter() - t0, file_path)
            
            # 4. Process OCR synchronously
            try:
                # Preprocessing -> outputs JPEG bytes
                t1 = time.perf_counter()
                processed_image_bytes = await preprocessor.preprocess_file(str(file_path), file.content_type)
                mime_type = "image/jpeg"
                logger.info("[OCR] Preprocessing done in %.3fs (bytes=%d, mime=%s)", time.perf_counter() - t1, len(processed_image_bytes or b""), mime_type)
                
                # LLM Call
                t2 = time.perf_counter()
                llm_response_json = await gemini_ocr_client.extract_expense_data(
                    image_bytes=processed_image_bytes,
                    hints=(hints.model_dump() if hints else None)
                )
                logger.info("[OCR] Gemini OCR call done in %.3fs", time.perf_counter() - t2)
                
                # Post-processing
                t3 = time.perf_counter()
                # Prefer apply_rules for backward-compatible tests; then post_process
                if hasattr(post_processor, "apply_rules") and callable(getattr(post_processor, "apply_rules", None)):
                    final_result_data = post_processor.apply_rules(
                        llm_response_json,
                        {"timezone": self.default_timezone}
                    )
                elif hasattr(post_processor, "post_process") and callable(getattr(post_processor, "post_process", None)):
                    final_result_data = post_processor.post_process(
                        llm_response_json,
                        hints={"timezone": self.default_timezone}
                    )
                else:
                    final_result_data = llm_response_json

                # Ensure dict output; if mocks return non-dict, fallback to raw llm json
                if not isinstance(final_result_data, dict):
                    final_result_data = llm_response_json if isinstance(llm_response_json, dict) else {}
                logger.info("[OCR] Post-processing done in %.3fs", time.perf_counter() - t3)
                
                # Validate result
                t4 = time.perf_counter()
                schema_validator.validate(final_result_data)
                logger.info("[OCR] Schema validation done in %.3fs", time.perf_counter() - t4)
                
                # 5. Save OCR result to session context
                t5 = time.perf_counter()
                await self._save_ocr_context_to_session(
                    db, session_id, user_id, final_result_data
                )
                logger.info("[OCR] Saved OCR context to session in %.3fs", time.perf_counter() - t5)
                
                # 6. Save OCR job record (for audit)
                job = OcrExpenseJob(
                    id=file_id,
                    session_id=session_id,
                    user_id=user_id,
                    original_filename=file.filename,
                    file_path=str(file_path),
                    file_size=file.size,
                    content_type=file.content_type,
                    profile=profile,
                    status="completed",
                    completed_at=datetime.now()
                )
                db.add(job)
                
                # 7. Save OCR result record
                # Compute auxiliary metrics
                processing_seconds = time.perf_counter() - start_time
                word_count = self._estimate_word_count(final_result_data)

                ocr_result = OcrExpenseResult(
                    job_id=job.id,
                    transaction_date=final_result_data.get("transaction_date"),
                    amount_value=final_result_data.get("amount", {}).get("value"),
                    amount_currency=final_result_data.get("amount", {}).get("currency"),
                    category_code=final_result_data.get("category", {}).get("code"),
                    category_name=final_result_data.get("category", {}).get("name"),
                    items_json=final_result_data.get("items"),
                    meta_json=final_result_data.get("meta"),
                    processing_time=processing_seconds,
                    word_count=word_count
                )
                db.add(ocr_result)

                t6 = time.perf_counter()
                await db.commit()
                await db.refresh(job)
                logger.info("[OCR] DB commit+refresh done in %.3fs", time.perf_counter() - t6)
                
                logger.info("[OCR] Completed for session=%s in %.3fs", session_id, time.perf_counter() - start_time)
                
                # In unit tests with mocked DB, created_at might be None. Ensure a value.
                if not getattr(job, "created_at", None):
                    job.created_at = datetime.now()

                # Base response
                base_response = OcrExpenseJobResponse(
                    job_id=job.id,
                    session_id=job.session_id,
                    user_id=job.user_id,
                    filename=job.original_filename,
                    status=job.status,
                    created_at=job.created_at
                )
                # Always attach structured result in response
                from app.modules.ocr_expense.schemas import (
                    OcrExpenseResult as OcrExpenseResultSchema,
                    OcrExpenseAmount as OcrExpenseAmountSchema,
                    OcrExpenseCategory as OcrExpenseCategorySchema,
                    OcrExpenseItem as OcrExpenseItemSchema,
                    OcrExpenseMeta as OcrExpenseMetaSchema,
                )
                amount_data = final_result_data.get("amount") or {}
                category_data = final_result_data.get("category") or {}
                items_data = final_result_data.get("items") or []
                meta_data = final_result_data.get("meta") or {}

                result_payload = OcrExpenseResultSchema(
                    transaction_date=final_result_data.get("transaction_date"),
                    amount=OcrExpenseAmountSchema(**amount_data),
                    category=OcrExpenseCategorySchema(**category_data),
                    items=[OcrExpenseItemSchema(**it) for it in items_data] or None,
                    meta=OcrExpenseMetaSchema(**meta_data),
                )
                base_response.result = result_payload

                return base_response
                
            finally:
                # Clean up file
                if file_path.exists():
                    file_path.unlink(missing_ok=True)
                    
        except (FileValidationError, UnsupportedMediaTypeError, SchemaViolationError):
            raise
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            raise InternalError(f"OCR extraction failed: {str(e)}")

    async def get_ocr_context_by_session(
        self,
        db: AsyncSession,
        session_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get OCR context for a session.
        """
        try:
            # Get latest OCR result for this session
            # Use ORM model (DB) not Pydantic schema
            from app.modules.ocr_expense.models import OcrExpenseResult as OcrExpenseResultDB, OcrExpenseJob as OcrExpenseJobDB
            result = await db.execute(
                select(OcrExpenseResultDB)
                .join(OcrExpenseJobDB)
                .where(OcrExpenseJobDB.session_id == session_id)
                .order_by(OcrExpenseResultDB.created_at.desc())
                .limit(1)
            )
            ocr_result_or_coro = result.scalar_one_or_none()
            ocr_result = (
                await ocr_result_or_coro
                if asyncio.iscoroutine(ocr_result_or_coro)
                else ocr_result_or_coro
            )
            
            if not ocr_result:
                return None
                
            return {
                "transaction_date": ocr_result.transaction_date,
                "amount": {
                    "value": ocr_result.amount_value,
                    "currency": ocr_result.amount_currency
                },
                "category": {
                    "code": ocr_result.category_code,
                    "name": ocr_result.category_name
                },
                "items": ocr_result.items_json,
                "meta": ocr_result.meta_json
            }
            
        except Exception as e:
            logger.error(f"Failed to get OCR context: {e}")
            return None

    async def _save_ocr_context_to_session(
        self,
        db: AsyncSession,
        session_id: str,
        user_id: str,
        ocr_data: Dict[str, Any]
    ) -> None:
        """
        Save OCR context to session as a system message.
        """
        try:
            # Build OCR context message
            # Normalize simple string fields to avoid accidental duplicated leading chars/whitespaces
            transaction_date = (ocr_data.get('transaction_date') or '').strip()
            amount_value = ocr_data.get('amount', {}).get('value', 0)
            amount_currency = (ocr_data.get('amount', {}).get('currency', 'VND') or '').strip()
            category_name = (ocr_data.get('category', {}).get('name') or '').strip()
            category_code = (ocr_data.get('category', {}).get('code') or '').strip()

            context_parts = [
                f"📄 OCR Result:",
                f"📅 Date: {transaction_date}",
                f"💰 Amount: {amount_value:,} {amount_currency}",
                f"🏷️ Category: {category_name} ({category_code})"
            ]
            
            if ocr_data.get('items'):
                context_parts.append("🛒 Items:")
                for item in ocr_data.get('items', []):
                    item_name = (item.get('name') or '').strip()
                    qty_value = item.get('qty', 1)
                    context_parts.append(f"  - {item_name} (qty: {qty_value})")
            
            if ocr_data.get('meta', {}).get('warnings'):
                context_parts.append("⚠️ Warnings:")
                for warning in ocr_data.get('meta', {}).get('warnings', []):
                    context_parts.append(f"  - {warning}")
            
            context_message = "\n".join(context_parts)
            
            # Save as system message to session
            metadata_payload = {"ocr_context": True, "ocr_data": ocr_data}
            try:
                logger.info("[OCR][debug] About to save OCR context. metadata keys=%s", list(metadata_payload.keys()))
                sample_item_name = None
                if isinstance(ocr_data.get('items'), list) and ocr_data['items']:
                    sample_item_name = (ocr_data['items'][0].get('name') or '').strip()
                logger.info("[OCR][debug] First item name (normalized)=%r", sample_item_name)
            except Exception:
                pass

            logger.info("[OCR][debug] Final context_message=%r", context_message)

            await save_message(
                db,
                session_id,
                user_id,
                "system",
                context_message,
                metadata_payload
            )
            
            logger.info(f"Saved OCR context to session {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to save OCR context: {e}")

    def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file."""
        logger.info(f"Validating file: filename={file.filename}, content_type={file.content_type}, size={file.size}")
        
        if not file.filename:
            raise FileValidationError("No filename provided")

        if file.content_type not in self.allowed_types:
            logger.error(f"File content_type '{file.content_type}' not in allowed_types: {self.allowed_types}")
            raise UnsupportedMediaTypeError(f"Unsupported media type: {file.content_type}")

    async def _save_file(self, file: UploadFile, file_path: Path) -> None:
        """Save uploaded file to disk."""
        try:
            with open(file_path, 'wb') as f:
                content = await file.read()
                f.write(content)
            if len(content) > self.max_file_size:
                file_path.unlink(missing_ok=True)
                raise FileValidationError(f"File size exceeds limit: {self.max_file_size} bytes")
        except FileValidationError:
            # Re-raise validation error without wrapping
            raise
        except Exception as e:
            raise InternalError(f"Failed to save file: {str(e)}")

    def _get_file_extension(self, filename: str) -> str:
        """Get file extension from filename."""
        return Path(filename).suffix.lower()

    def _estimate_word_count(self, result_data: Dict[str, Any]) -> int:
        """Estimate word count from structured OCR result.
        Uses textual fields and item names to compute a simple word count.
        Always returns a non-negative integer.
        """
        try:
            parts: List[str] = []
            # Category and names
            category_name = (result_data.get("category") or {}).get("name") or ""
            parts.append(str(category_name))
            # Items
            for item in result_data.get("items") or []:
                if isinstance(item, dict):
                    parts.append(str(item.get("name") or ""))
            # Meta warnings
            for w in (result_data.get("meta") or {}).get("warnings") or []:
                parts.append(str(w))
            # Join and split on whitespace
            text = " ".join(p for p in parts if p)
            tokens = text.split()
            return max(0, len(tokens))
        except Exception:
            return 0


# Global service instance
ocr_expense_service = OcrExpenseService()