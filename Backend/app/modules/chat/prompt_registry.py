from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

from app.core.config import settings


DEFAULT_SYSTEM_PROMPT_PATH = Path("app/modules/chat/prompts/system.txt")


class PromptRegistry:
    def __init__(self, base_path: Optional[Path] = None):
        self.base_path = base_path or Path(".")
        self.cache: Dict[str, str] = {}

    def load_system_prompt(self, name: str = "system") -> str:
        key = f"sys:{name}"
        if key in self.cache:
            return self.cache[key]

        # Cho phép nhiều prompt theo tên: system -> system.txt, suggestion -> suggestion.txt
        filename = f"{name}.txt"
        path = Path("app/modules/chat/prompts") / filename
        if not path.exists():
            path = DEFAULT_SYSTEM_PROMPT_PATH
        if not path.is_absolute():
            path = self.base_path / path
        content = path.read_text(encoding="utf-8")
        self.cache[key] = content
        return content


prompt_registry = PromptRegistry()





