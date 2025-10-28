import time
import uuid
from typing import Callable

from starlette.types import ASGIApp, Receive, Scope, Send


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        request_id = uuid.uuid4().hex
        start = time.perf_counter()

        async def send_wrapper(message):
            if message.get("type") == "http.response.start":
                headers = [(b"x-request-id", request_id.encode("utf-8"))]
                raw_headers = message.setdefault("headers", [])
                raw_headers.extend(headers)
            elif message.get("type") == "http.response.body":
                duration_ms = int((time.perf_counter() - start) * 1000)
                # can't modify body easily here; set a trailer header alternative
                raw_headers = message.setdefault("headers", [])
                raw_headers.append((b"x-response-time", str(duration_ms).encode("utf-8")))
            await send(message)

        await self.app(scope, receive, send_wrapper)





