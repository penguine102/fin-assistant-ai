from __future__ import annotations

from typing import Any, Dict, List

import httpx

from app.core.config import settings


class ChatProviderClient:
    """Client tối giản để gọi provider /v1/chat/completions."""

    def __init__(self, timeout_seconds: int = 60):
        self.base_url = settings.CHAT_API_BASE.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _endpoint(self) -> str:
        return f"{self.base_url}/v1/chat/completions"

    def _headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            # Không log giá trị Authorization ở nơi khác
            "Authorization": f"Bearer {settings.CHAT_API_KEY}",
        }

    def _build_body(
        self,
        *,
        model: str,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> Dict[str, Any]:
        return {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

    async def completions(
        self,
        *,
        messages: List[Dict[str, str]],
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> Dict[str, Any]:
        body = self._build_body(
            model=model or settings.CHAT_MODEL,
            messages=messages,
            max_tokens=max_tokens or settings.CHAT_MAX_TOKENS,
            temperature=temperature or settings.CHAT_TEMPERATURE,
        )
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(self._endpoint(), headers=self._headers(), json=body)
            resp.raise_for_status()
            return resp.json()



