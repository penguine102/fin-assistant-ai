from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.middleware import get_current_user
from app.modules.users.service import User
from app.modules.chat.schemas import ChatRequest, ChatResponse, SessionResponse, ChatMessage, SuggestionRequest, SuggestionResponse
from app.modules.chat.service import chat_infer, create_session, get_user_sessions, mock_simple_response, clear_session_cache, get_cache_stats, test_ai_response_format, get_chat_history, suggestion_infer


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=SessionResponse)
async def create_chat_session(
    user_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SessionResponse:
    """Tạo session chat mới cho user"""
    session = await create_session(db, user_id)
    return SessionResponse.model_validate(session)


@router.get("/sessions", response_model=list[SessionResponse])
async def get_sessions(
    user_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[SessionResponse]:
    """Lấy danh sách sessions của user"""
    sessions = await get_user_sessions(db, user_id)
    return [SessionResponse.model_validate(s) for s in sessions]


@router.get("/history", response_model=list[ChatMessage])
async def read_chat_history(
    session_id: str, 
    limit: int = 20, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[ChatMessage]:
    """Đọc lại lịch sử/luồng chat theo session_id (ưu tiên Redis cache)."""
    history = await get_chat_history(db, session_id, limit)
    return history


@router.post("/", response_model=ChatResponse)
async def chat(
    payload: ChatRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ChatResponse:
    return await chat_infer(payload, db)


@router.post("/mock", response_model=ChatResponse)
async def chat_mock() -> ChatResponse:
    """Test endpoint với mock response"""
    return await mock_simple_response()


@router.post("/suggestion", response_model=SuggestionResponse)
async def chat_suggestion(
    payload: SuggestionRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SuggestionResponse:
    """Sinh gợi ý (suggestion) riêng, dùng system prompt suggestion."""
    return await suggestion_infer(payload, db)


@router.delete("/cache/{session_id}")
async def clear_cache(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Xóa cache của session"""
    await clear_session_cache(session_id)
    return {"message": f"Cache cleared for session {session_id}"}


@router.get("/cache/{session_id}/stats")
async def get_cache_statistics(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Lấy thống kê cache của session"""
    stats = await get_cache_stats(session_id)
    return stats


@router.get("/test/ai-format")
async def test_ai_response():
    """Test AI response format để debug suggestion"""
    result = await test_ai_response_format()
    return result



