from __future__ import annotations

from typing import List, Optional
from datetime import datetime
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.chat.prompt_registry import prompt_registry
from app.modules.chat.schemas import ChatMessage, ChatRequest, ChatResponse
from app.modules.chat.models import Session, Message
from app.modules.chat.cache import chat_cache
from app.modules.chat.schemas import SuggestionRequest, SuggestionResponse
from app.modules.chat.provider import ChatProviderClient


async def build_messages(payload: ChatRequest, db_session: AsyncSession) -> List[ChatMessage]:
    # Dùng system prompt tự nhiên (plain text)
    system_prompt = prompt_registry.load_system_prompt("system")
    
    # Check for OCR context in session
    try:
        from app.modules.ocr_expense.service import ocr_expense_service
        ocr_context = await ocr_expense_service.get_ocr_context_by_session(db_session, payload.session_id)
        if ocr_context:
            # Add OCR context to system prompt
            ocr_info = f"""
OCR Context Available:
- Transaction Date: {ocr_context.get('transaction_date')}
- Amount: {ocr_context.get('amount', {}).get('value', 0):,} {ocr_context.get('amount', {}).get('currency', 'VND')}
- Category: {ocr_context.get('category', {}).get('name')} ({ocr_context.get('category', {}).get('code')})
- Items: {len(ocr_context.get('items', []))} items
"""
            if ocr_context.get('items'):
                ocr_info += "\nItems:\n"
                for item in ocr_context.get('items', []):
                    ocr_info += f"- {item.get('name')} (qty: {item.get('qty', 1)})\n"
            
            system_prompt += f"\n\n{ocr_info}\n\nBạn có thể trả lời câu hỏi về thông tin OCR này."
    except Exception as e:
        # OCR context not available, continue with normal flow
        pass
    
    messages: List[ChatMessage] = [ChatMessage(role="system", content=system_prompt)]
    # Lấy lịch sử trực tiếp từ Redis/DB và chỉ lấy các lượt user gần nhất
    history_messages = await get_chat_history(db_session, payload.session_id)
    if history_messages:
        normalized_history: List[ChatMessage] = []
        for m in history_messages:
            if isinstance(m, dict):
                role = m.get("role")
                content = m.get("content")
                if role and content is not None:
                    normalized_history.append(ChatMessage(role=role, content=content))
            else:
                normalized_history.append(m)
        user_only_history = [m for m in normalized_history if m.role == "user"]
        messages.extend(user_only_history[-3:])
    messages.append(ChatMessage(role="user", content=payload.query))
    return messages


async def create_session(session: AsyncSession, user_id: str) -> Session:
    """Tạo session mới cho user"""
    new_session = Session(
        user_id=user_id,
        session_name=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)
    return new_session


async def get_user_sessions(session: AsyncSession, user_id: str) -> List[Session]:
    """Lấy danh sách sessions của user"""
    result = await session.execute(
        select(Session)
        .where(Session.user_id == user_id)
        .where(Session.is_active == True)
        .order_by(Session.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_or_create_session(session: AsyncSession, user_id: str, session_id: str) -> Session:
    """Lấy hoặc tạo session mới"""
    if session_id:
        # Tìm session theo ID
        result = await session.execute(select(Session).where(Session.id == session_id))
        existing_session = result.scalar_one_or_none()
        if existing_session:
            return existing_session
    
    # Tạo session mới
    new_session = Session(
        user_id=user_id,
        session_name=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)
    return new_session


async def save_message(session: AsyncSession, session_id: str, user_id: str, role: str, content: str, metadata: dict = None) -> Message:
    """Lưu tin nhắn vào database và cache vào Redis"""
    try:
        print(f"[chat.save_message][debug] metadata keys={list((metadata or {}).keys())}")
        try:
            import json as _json
            _preview = _json.dumps(metadata, ensure_ascii=False) if metadata is not None else "null"
            if len(_preview) > 200:
                _preview = _preview[:200] + "..."
            print(f"[chat.save_message][debug] metadata preview={_preview}")
        except Exception:
            pass
    except Exception:
        pass

    # Defensive normalization: fix historical typo key 'ocr_datta' -> 'ocr_data'
    if isinstance(metadata, dict) and "ocr_datta" in metadata and "ocr_data" not in metadata:
        try:
            metadata["ocr_data"] = metadata.pop("ocr_datta")
        except Exception:
            # If anything goes wrong, keep original metadata unchanged
            pass
    message = Message(
        session_id=session_id,
        user_id=user_id,
        role=role,
        content=content,
        message_metadata=metadata
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    
    # Cache message vào Redis
    await chat_cache.add_message(session_id, message.id, role, content)
    print(f"💾 Cached message {message.id} vào Redis cho session {session_id}")
    
    return message


async def get_chat_history(session: AsyncSession, session_id: str, limit: int = 20) -> List[ChatMessage]:
    """Lấy lịch sử chat - ưu tiên Redis cache trước, fallback database"""
    
    # 1. Thử lấy từ Redis cache trước
    cached_messages = await chat_cache.get_chat_history(session_id, limit=limit)
    if cached_messages:
        print(f"✅ Cache HIT: Lấy {len(cached_messages)} messages từ Redis cho session {session_id}")
        return cached_messages
    
    # 2. Cache MISS - Lấy từ database
    print(f"❌ Cache MISS: Lấy từ database cho session {session_id}")
    result = await session.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    
    # Đảo ngược lại để có thứ tự từ cũ đến mới
    messages.reverse()
    
    db_messages = [ChatMessage(role=msg.role, content=msg.content) for msg in messages]
    
    # 3. Cache messages vào Redis cho lần sau
    if db_messages:
        for msg in messages:
            await chat_cache.add_message(session_id, msg.id, msg.role, msg.content)
        print(f"💾 Cached {len(db_messages)} messages vào Redis cho session {session_id}")
    
    return db_messages


async def mock_simple_response() -> ChatResponse:
    """Mock response đơn giản để test"""
    return ChatResponse(
        answer="Đây là câu trả lời mock để test API. Backend đang hoạt động bình thường!",
        suggestion="Hãy thử hỏi câu hỏi khác",
        session_id="mock-session-id"
    )


async def chat_infer(payload: ChatRequest, db_session: AsyncSession) -> ChatResponse:
    # Lấy session theo ID (bắt buộc) - session_id là string, đồng thời xác thực chủ sở hữu
    result = await db_session.execute(select(Session).where(Session.id == payload.session_id))
    chat_session = result.scalar_one_or_none()
    if not chat_session:
        raise ValueError(f"Session {payload.session_id} không tồn tại")
    # Xác thực user sở hữu session
    if chat_session.user_id != payload.user_id:
        raise ValueError("User không có quyền truy cập session này")
    
    # Prefetch OCR context để đảm bảo tích hợp (và để test có thể assert được lời gọi)
    try:
        from app.modules.ocr_expense.service import ocr_expense_service
        _ = await ocr_expense_service.get_ocr_context_by_session(db_session, payload.session_id)
    except Exception:
        pass
    
    # Lấy và build messages từ Redis/DB TRƯỚC KHI lưu tin nhắn mới (tránh duplicate)
    messages = await build_messages(payload, db_session)
    
    # Lưu tin nhắn user SAU KHI đã build messages (để tránh duplicate trong history)
    await save_message(
        db_session, 
        chat_session.id, 
        payload.user_id, 
        "user", 
        payload.query
    )

    # Map ChatMessage -> provider format
    provider_messages = [
        ( {"role": m.get("role"), "content": m.get("content")} if isinstance(m, dict)
          else {"role": m.role, "content": m.content} )
        for m in messages
    ]

    provider = ChatProviderClient(timeout_seconds=60)

    async def mock_chat_response() -> dict:
        """Mock response khi API lỗi"""
        return {
            "choices": [{
                "message": {
                    "content": '{"answer": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.", "suggestion": "Thử lại sau ít phút"}'
                }
            }]
        }

    try:
        if payload.suggestion:
            # Chuẩn bị payload cho suggestion (song song)
            suggestion_system_prompt = prompt_registry.load_system_prompt("suggestion")
            suggestion_messages = [
                {"role": "system", "content": suggestion_system_prompt},
                {"role": "user", "content": payload.query},
            ]

            chat_task = provider.completions(messages=provider_messages)
            sugg_task = provider.completions(messages=suggestion_messages)
            data, sugg_data = await asyncio.gather(chat_task, sugg_task)
        else:
            data = await provider.completions(messages=provider_messages)
            sugg_data = {"choices": [{"message": {"content": ""}}]}
    except Exception as e:
        print(f"API Error: {e}")
        print("Using mock response for chat, and empty suggestion...")
        data = await mock_chat_response()
        sugg_data = {"choices": [{"message": {"content": ""}}]}

    # Lấy trực tiếp content từ provider
    raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"🤖 AI Raw Response: {raw_text}")

    answer_text = raw_text.strip() if isinstance(raw_text, str) else ""
    suggestion: str | None = None

    if not answer_text:
        answer_text = "Xin lỗi, hiện tôi chưa có câu trả lời. Vui lòng thử lại."

    # Parse suggestion: prompt suggestion trả về plain text content
    suggestion_raw = sugg_data.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"🤖 Suggestion Raw Response (parallel): {suggestion_raw}")
    if isinstance(suggestion_raw, str):
        suggestion_raw = suggestion_raw.strip()
    suggestion = suggestion_raw if suggestion_raw else suggestion

    # Lưu tin nhắn assistant kèm suggestion vào metadata
    metadata = {"suggestion": suggestion} if suggestion is not None else None
    saved_assistant = await save_message(
        db_session,
        chat_session.id,
        payload.user_id,
        "assistant",
        answer_text,
        metadata
    )

    return ChatResponse(answer=answer_text, suggestion=suggestion, session_id=chat_session.id)


async def clear_session_cache(session_id: str) -> None:
    """Xóa cache của session"""
    await chat_cache.clear_session_cache(session_id)
    print(f"🗑️ Cleared cache cho session {session_id}")


async def get_cache_stats(session_id: str) -> dict:
    """Lấy thống kê cache của session"""
    return await chat_cache.get_cache_stats(session_id)


async def test_ai_response_format() -> dict:
    """Gọi thử provider và trả về phần content để debug."""
    messages = [
        {"role": "user", "content": "Xin chào, bạn có thể giúp tôi không?"}
    ]
    provider = ChatProviderClient(timeout_seconds=30)
    try:
        data = await provider.completions(messages=messages, model=settings.CHAT_MODEL, max_tokens=1000, temperature=0.2)
        raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {
            "status": "success",
            "raw_response": raw_text,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "raw_response": None
        }

async def suggestion_infer(payload: SuggestionRequest, db_session: AsyncSession) -> SuggestionResponse:
    # Dùng prompt riêng cho suggestion
    system_prompt = prompt_registry.load_system_prompt("suggestion")
    messages = [
        ChatMessage(role="system", content=system_prompt)
    ]
    if payload.context:
        messages.append(ChatMessage(role="user", content=payload.context))
    messages.append(ChatMessage(role="user", content=payload.query))

    provider_messages = [{"role": m.role, "content": m.content} for m in messages]

    provider = ChatProviderClient(timeout_seconds=30)

    try:
        data = await provider.completions(messages=provider_messages)
    except Exception as e:
        # fallback đề phòng lỗi provider: trả suggestion null
        print(f"Suggestion API Error: {e}")
        return SuggestionResponse(suggestion=None, session_id=payload.session_id)

    raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"🤖 Suggestion Raw Response: {raw_text}")

    # Prompt đã yêu cầu plain text -> lấy trực tiếp
    suggestion_value: str | None = raw_text.strip() if isinstance(raw_text, str) and raw_text.strip() else None

    # Lưu suggestion vào message gần nhất (assistant) trong session (nếu có session_id)
    if payload.session_id and suggestion_value is not None:
        try:
            result = await db_session.execute(
                select(Message)
                .where(Message.session_id == payload.session_id)
                .where(Message.role == "assistant")
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            latest_msg: Message | None = result.scalar_one_or_none()
            if latest_msg:
                metadata = latest_msg.message_metadata or {}
                if not isinstance(metadata, dict):
                    metadata = {}
                metadata["suggestion"] = suggestion_value
                latest_msg.message_metadata = metadata
                await db_session.commit()
        except Exception as e:
            print(f"❗ Lỗi lưu suggestion vào metadata: {e}")

    return SuggestionResponse(suggestion=suggestion_value, session_id=payload.session_id)



