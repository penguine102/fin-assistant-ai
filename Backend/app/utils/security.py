from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt as PyJWT

from app.core.config import settings


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(days=7)
    expire = datetime.now(tz=timezone.utc) + expires_delta
    to_encode: Dict[str, Any] = {"sub": str(subject), "exp": expire}
    return PyJWT.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> Dict[str, Any]:
    return PyJWT.decode(token, settings.JWT_SECRET, algorithms=["HS256"])  # type: ignore[no-any-return]





