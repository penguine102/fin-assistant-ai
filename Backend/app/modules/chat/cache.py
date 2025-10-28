from __future__ import annotations

import json
from typing import List, Optional
from datetime import datetime, timedelta

from app.redis.client import get_redis_client
from app.modules.chat.schemas import ChatMessage


class ChatCache:
    """Redis cache cho chat history"""
    
    def __init__(self):
        self.redis = get_redis_client()
        self.ttl = 3600  # 1 hour TTL
        self.max_messages = 20  # Tối đa 20 messages trong cache
    
    def _get_session_key(self, session_id: str) -> str:
        """Tạo Redis key cho session"""
        return f"chat:session:{session_id}"
    
    def _get_message_key(self, session_id: str, message_id: str) -> str:
        """Tạo Redis key cho message"""
        return f"chat:message:{session_id}:{message_id}"
    
    async def get_chat_history(self, session_id: str, limit: int | None = None) -> Optional[List[ChatMessage]]:
        """Lấy chat history từ Redis cache (ưu tiên), tôn trọng limit nếu có"""
        try:
            session_key = self._get_session_key(session_id)
            
            # Lấy danh sách message IDs từ Redis
            max_count = self.max_messages if limit is None else min(self.max_messages, max(0, limit))
            message_ids = await self.redis.lrange(session_key, 0, max_count - 1)
            
            if not message_ids:
                return None
            
            # Lấy từng message từ Redis (lpush lưu mới nhất ở đầu; sẽ đảo thứ tự trước khi trả)
            messages = []
            for msg_id in message_ids:
                message_key = self._get_message_key(session_id, msg_id)
                message_data = await self.redis.get(message_key)
                
                if message_data:
                    msg_dict = json.loads(message_data)
                    messages.append(ChatMessage(
                        role=msg_dict["role"],
                        content=msg_dict["content"]
                    ))
            
            # Đảo ngược để trả theo thứ tự cũ -> mới cho đồng nhất với DB
            if messages:
                messages.reverse()
                return messages
            return None
            
        except Exception as e:
            print(f"Redis cache error: {e}")
            return None
    
    async def add_message(self, session_id: str, message_id: str, role: str, content: str) -> None:
        """Thêm message vào Redis cache"""
        try:
            session_key = self._get_session_key(session_id)
            message_key = self._get_message_key(session_id, message_id)
            
            # Lưu message data
            message_data = {
                "id": message_id,
                "role": role,
                "content": content,
                "created_at": datetime.now().isoformat()
            }
            
            await self.redis.setex(
                message_key, 
                self.ttl, 
                json.dumps(message_data, ensure_ascii=False)
            )
            
            # Thêm message ID vào danh sách session
            await self.redis.lpush(session_key, message_id)
            
            # Giới hạn số lượng messages trong cache
            await self.redis.ltrim(session_key, 0, self.max_messages - 1)
            
            # Set TTL cho session key
            await self.redis.expire(session_key, self.ttl)
            
        except Exception as e:
            print(f"Redis cache add error: {e}")
    
    async def clear_session_cache(self, session_id: str) -> None:
        """Xóa cache của session"""
        try:
            session_key = self._get_session_key(session_id)
            
            # Lấy tất cả message IDs
            message_ids = await self.redis.lrange(session_key, 0, -1)
            
            # Xóa từng message
            for msg_id in message_ids:
                message_key = self._get_message_key(session_id, msg_id)
                await self.redis.delete(message_key)
            
            # Xóa session key
            await self.redis.delete(session_key)
            
        except Exception as e:
            print(f"Redis cache clear error: {e}")
    
    async def get_cache_stats(self, session_id: str) -> dict:
        """Lấy thống kê cache"""
        try:
            session_key = self._get_session_key(session_id)
            message_count = await self.redis.llen(session_key)
            ttl = await self.redis.ttl(session_key)
            
            return {
                "session_id": session_id,
                "message_count": message_count,
                "ttl": ttl,
                "max_messages": self.max_messages
            }
        except Exception as e:
            print(f"Redis cache stats error: {e}")
            return {"error": str(e)}


# Global cache instance
chat_cache = ChatCache()
