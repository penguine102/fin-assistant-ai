from typing import Any, Optional

from fastapi.responses import JSONResponse


def success(data: Any = None, message: str = "OK") -> JSONResponse:
    return JSONResponse({"success": True, "message": message, "data": data})


def error(message: str, status_code: int = 400, details: Optional[Any] = None) -> JSONResponse:
    payload = {"success": False, "message": message}
    if details is not None:
        payload["details"] = details
    return JSONResponse(payload, status_code=status_code)





