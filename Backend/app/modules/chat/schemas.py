from __future__ import annotations

from typing import Literal, Optional
from datetime import datetime

from pydantic import BaseModel, Field
from pydantic import ConfigDict


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    user_id: str
    session_id: str  # Bắt buộc phải có session_id
    query: str = Field(..., min_length=1)
    suggestion: bool = False  # Nếu true, backend sẽ gọi thêm luồng suggestion song song


class ChatResponse(BaseModel):
    answer: str
    suggestion: Optional[str] = None
    session_id: Optional[str] = None  # Trả về session_id để client biết


class SessionResponse(BaseModel):
    id: str
    user_id: str
    session_name: str
    created_at: datetime
    updated_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    role: str
    content: str
    created_at: datetime
    message_metadata: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)



class SuggestionRequest(BaseModel):
    user_id: str
    session_id: str | None = None
    context: str | None = None  # tùy chọn: ngữ cảnh gần nhất
    query: str = Field(..., min_length=1)


class SuggestionResponse(BaseModel):
    suggestion: str | None = None
    session_id: str | None = None


