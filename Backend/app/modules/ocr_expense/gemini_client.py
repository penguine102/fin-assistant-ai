"""
Simplified Gemini OCR Client - Refactored for JSON mode only.
Removes financial mode and JSON repair methods.
"""

import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiOcrClient:
    """Simplified Gemini OCR client for expense extraction."""
    
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL_NAME
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = getattr(settings, "GEMINI_API_BASE_URL", None)

        if not self.api_key:
            logger.error("GEMINI_API_KEY is not set. Please configure it in .env")
            raise RuntimeError("Missing GEMINI_API_KEY")

        try:
            # Align with working reference (readfile.py): pass custom endpoint via http_options
            client_kwargs: Dict[str, Any] = {"api_key": self.api_key}
            if self.base_url:
                client_kwargs["http_options"] = types.HttpOptions(base_url=self.base_url)
                logger.info("Using custom Gemini API base URL: %s", self.base_url)
            self.client = genai.Client(**client_kwargs)
            logger.info("Gemini OCR client initialized | model=%s", self.model_name)
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise
    
    async def extract_expense_data(
        self, 
        image_bytes: bytes, 
        hints: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Extract expense data from image using Gemini Vision API.
        
        Args:
            image_bytes: Image data as bytes
            hints: Optional hints for extraction
            
        Returns:
            Dictionary containing extracted expense data
        """
        import time as _time
        
        _t0 = _time.perf_counter()
        
        try:
            # Build prompt with hints
            prompt = self._build_expense_prompt(hints)
            
            # Create image part (google.genai types)
            image = types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            )
            
            # Define response schema for structured JSON output (Gemini Structured Output)
            # This guarantees LLM returns valid JSON with required fields
            response_schema = types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "transaction_date": types.Schema(
                        type=types.Type.STRING,
                        description="Transaction date in YYYY-MM-DD format"
                    ),
                    "amount": types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "value": types.Schema(
                                type=types.Type.INTEGER,
                                description="Amount value as integer"
                            ),
                            "currency": types.Schema(
                                type=types.Type.STRING,
                                description="Currency code, always 'VND'"
                            )
                        },
                        required=["value", "currency"],
                        description="Amount information with value and currency"
                    ),
                    "category": types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "code": types.Schema(
                                type=types.Type.STRING,
                                description="Category code: FNB, GRO, TRA, UTI, ENT, or OTH"
                            ),
                            "name": types.Schema(
                                type=types.Type.STRING,
                                description="Category name in Vietnamese"
                            )
                        },
                        required=["code", "name"],
                        description="Transaction category information"
                    ),
                    "items": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "name": types.Schema(
                                    type=types.Type.STRING,
                                    description="Item name"
                                ),
                                "qty": types.Schema(
                                    type=types.Type.INTEGER,
                                    description="Item quantity"
                                )
                            },
                            required=["name", "qty"],
                            description="Individual item information"
                        ),
                        description="List of items in the transaction"
                    ),
                    "meta": types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "needs_review": types.Schema(
                                type=types.Type.BOOLEAN,
                                description="Whether this transaction needs manual review"
                            ),
                            "warnings": types.Schema(
                                type=types.Type.ARRAY,
                                items=types.Schema(type=types.Type.STRING),
                                description="List of warning messages"
                            )
                        },
                        required=["needs_review", "warnings"],
                        description="Metadata about transaction processing"
                    )
                },
                required=["transaction_date", "amount", "category", "items", "meta"]
            )

            # JSON mode with structured output enforcement
            if not self.client:
                raise RuntimeError("Gemini client is not initialized")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt, image],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=getattr(settings, "GEMINI_TEMPERATURE", 0.2),
                    top_p=0.85,
                    top_k=20,
                    max_output_tokens=max(1024, settings.GEMINI_MAX_TOKENS),
                ),
            )
            logger.info("[OCR] Using Gemini response schema enforcement ✅")
            
            logger.info("[OCR] Gemini generate_content finished in %.3fs (mode=json, model=%s)", _time.perf_counter() - _t0, self.model_name)
            
            # Parse response
            result_text = (getattr(response, "text", None) or "").strip()
            
            # Log response diagnostics
            try:
                candidates = getattr(response, "candidates", None)
                token_info = getattr(response, "usage_metadata", None)
                logger.info(
                    "[OCR] Gemini response diagnostics: text_len=%d, candidates=%s, usage=%s",
                    len(result_text),
                    None if candidates is None else len(candidates),
                    token_info,
                )
            except Exception:
                pass

            if not result_text:
                logger.error("Gemini returned empty text response.")
                raise ValueError("Empty response from Gemini")
            logger.info(f"Gemini raw response: {result_text}")

            # With response_schema, Gemini API guarantees valid JSON
            # Parse JSON directly from structured response
            try:
                parsed_json = json.loads(result_text)
                logger.info("[OCR] Successfully parsed JSON from structured response")
                return parsed_json

            except json.JSONDecodeError as e:
                logger.error(f"[OCR] JSON parsing failed: {e}")
                logger.error(f"Raw response: {result_text}")
                raise ValueError(f"Invalid JSON response from Gemini: {e}")
            except Exception as e:
                logger.error(f"[OCR] Unexpected error parsing response: {e}")
                raise ValueError(f"Failed to parse response: {e}")
            
        except Exception as e:
            logger.error(f"Gemini OCR extraction failed: {e}")
            raise RuntimeError(f"OCR extraction failed: {e}")
    
    def _build_expense_prompt(self, hints: Optional[Dict] = None) -> str:
        """Build the expense extraction prompt by loading from file."""
        
        # Load prompt from file
        prompt_file = Path(__file__).parent / "prompts" / "system.txt"
        
        try:
            prompt = prompt_file.read_text(encoding="utf-8")
            logger.info("[OCR] Loaded prompt from file: %s", prompt_file)
        except Exception as e:
            logger.error("[OCR] Failed to load prompt file, using fallback: %s", e)
            # Fallback prompt
            prompt = """You are an invoice extractor. Return EXACTLY ONE JSON object matching this schema:

{
  "transaction_date": "YYYY-MM-DD",
  "amount": { "value": <int>, "currency": "VND" },
  "category": { "code": "FNB|GRO|TRA|UTI|ENT|OTH", "name": "<vi>" },
  "items": [ { "name": "<string>", "qty": <int> } ],
  "meta": { "needs_review": <bool>, "warnings": [] }
}

Extract invoice data and return only the JSON object."""

        # Add hints if provided
        if hints:
            hint_lines = []
            if hints.get("language"):
                hint_lines.append(f"- Ngôn ngữ: {hints['language']}")
            if hints.get("timezone"):
                hint_lines.append(f"- Múi giờ: {hints['timezone']}")
            if hints.get("items_expected"):
                hint_lines.append("- Khuyến khích trích xuất items nếu có thể")
            
            if hint_lines:
                prompt = f"{prompt}\n\nGợi ý:\n" + "\n".join(hint_lines)

        logger.info("[OCR] OCR prompt prepared (len=%d). Preview: %s", len(prompt), prompt[:120].replace("\n", " "))
        return prompt

    async def test_connection(self) -> bool:
        """Test Gemini API connection."""
        if not self.client:
            return False
        
        try:
            # Simple test with minimal content
            response = self.client.generate_content(
                contents=["Test connection"],
                generation_config=types.GenerationConfig(
                    max_output_tokens=10,
                    temperature=0.0
                )
            )
            return response.text is not None
        except Exception as e:
            logger.error(f"Gemini connection test failed: {e}")
            return False


# Global instance
gemini_ocr_client = GeminiOcrClient()
