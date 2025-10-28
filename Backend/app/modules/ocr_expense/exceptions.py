"""
Simplified OCR Expense Exceptions - Option 2 Implementation.
Only essential exceptions for synchronous OCR processing.
"""

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from starlette.requests import Request


class OcrExpenseException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, detail: any = None):
        super().__init__(status_code=status_code, detail={"code": code, "message": message, "detail": detail})
        self.code = code
        self.message = message


class FileValidationError(OcrExpenseException):
    def __init__(self, message: str, detail: any = None):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, code="FILE_INVALID", message=message, detail=detail)


class UnsupportedMediaTypeError(OcrExpenseException):
    def __init__(self, message: str, detail: any = None):
        super().__init__(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, code="UNSUPPORTED_MEDIA_TYPE", message=message, detail=detail)


class SchemaViolationError(OcrExpenseException):
    def __init__(self, message: str, detail: any = None):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, code="SCHEMA_VIOLATION", message=message, detail=detail)


class InternalError(OcrExpenseException):
    def __init__(self, message: str, detail: any = None):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, code="INTERNAL_ERROR", message=message, detail=detail)


async def ocr_expense_exception_handler(request: Request, exc: OcrExpenseException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


def register_ocr_exception_handlers(app):
    app.add_exception_handler(OcrExpenseException, ocr_expense_exception_handler)
