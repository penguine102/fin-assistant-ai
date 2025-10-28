"""
Post-processing rules for OCR expense extraction.
Implements date defaulting, cash/change guard, amount normalization, and items cleanup.
"""

import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import pytz

from app.core.config import settings

logger = logging.getLogger(__name__)


class OcrPostProcessor:
    """Post-processes OCR results according to spec rules."""
    
    def __init__(self):
        self.default_timezone = pytz.timezone(settings.OCR_DEFAULT_TIMEZONE)
    
    def post_process(self, llm_result: Dict[str, Any], hints: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Apply post-processing rules to LLM result.
        
        Args:
            llm_result: Raw result from Gemini API
            hints: Optional hints (timezone, etc.)
            
        Returns:
            Post-processed result
        """
        try:
            result = llm_result.copy()
            
            # 1. Validate schema (basic check)
            if not self._validate_basic_schema(result):
                raise ValueError("Invalid basic schema: missing required fields")
            
            # 2. Normalize amount
            result = self._normalize_amount(result)
            
            # 3. Date strategy = extraction_date
            result = self._handle_date_defaulting(result, hints)
            
            # 4. Cash/Change guard (autocorrect)
            result = self._apply_cash_change_guard(result)
            
            # 5. Items cleanup
            result = self._cleanup_items(result)
            
            # 6. Meta finalize
            result = self._finalize_meta(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Post-processing failed: {e}")
            raise ValueError(f"Post-processing failed: {e}")
    
    def _validate_basic_schema(self, result: Dict[str, Any]) -> bool:
        """Basic schema validation - check required fields."""
        required_fields = ["amount", "category"]
        
        for field in required_fields:
            if field not in result:
                return False
        
        # Check amount structure
        if not isinstance(result["amount"], dict) or "value" not in result["amount"]:
            return False
        
        # Check category structure
        if not isinstance(result["category"], dict) or "code" not in result["category"]:
            return False
        
        return True
    
    def _normalize_amount(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize amount to integer VND."""
        try:
            amount = result["amount"]
            value = amount["value"]
            
            # Convert to string first to handle various formats
            if isinstance(value, str):
                # Remove common separators and currency symbols
                value = re.sub(r'[.,₫đ\s]', '', value)
                value = int(value) if value.isdigit() else 0
            elif isinstance(value, (int, float)):
                value = int(value)
            else:
                value = 0
            
            # Ensure non-negative
            value = max(0, value)
            
            result["amount"]["value"] = value
            result["amount"]["currency"] = "VND"
            
            return result
            
        except Exception as e:
            logger.error(f"Amount normalization failed: {e}")
            result["amount"]["value"] = 0
            result["amount"]["currency"] = "VND"
            return result
    
    def _handle_date_defaulting(self, result: Dict[str, Any], hints: Optional[Dict] = None) -> Dict[str, Any]:
        """Handle date defaulting strategy."""
        try:
            transaction_date = result.get("transaction_date", "")
            
            # Check if date is valid
            if not self._is_valid_date(transaction_date):
                # Use extraction date
                timezone_str = hints.get("timezone") if hints else None
                tz = pytz.timezone(timezone_str) if timezone_str else self.default_timezone
                
                extraction_date = datetime.now(tz).strftime("%Y-%m-%d")
                result["transaction_date"] = extraction_date
                
                # Add warning
                if "meta" not in result:
                    result["meta"] = {}
                if "warnings" not in result["meta"]:
                    result["meta"]["warnings"] = []
                
                result["meta"]["warnings"].append("date_defaulted_to_extraction")
                result["meta"]["needs_review"] = True
                
                logger.info(f"Date defaulted to extraction date: {extraction_date}")
            
            return result
            
        except Exception as e:
            logger.error(f"Date defaulting failed: {e}")
            # Fallback to current date
            result["transaction_date"] = datetime.now(self.default_timezone).strftime("%Y-%m-%d")
            return result
    
    def _is_valid_date(self, date_str: str) -> bool:
        """Check if date string is valid YYYY-MM-DD format."""
        if not isinstance(date_str, str):
            return False
        
        # Check format
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
            return False
        
        # Check if it's a valid date
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
            return True
        except ValueError:
            return False
    
    def _apply_cash_change_guard(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply cash/change guard to auto-correct amount.
        This is a simplified version - in practice, you'd need the original text.
        """
        try:
            # This is a placeholder implementation
            # In a real implementation, you'd analyze the original text for:
            # - "PHƯƠNG THỨC THANH TOÁN" | "TIỀN MẶT"/"CARD"
            # - "TIỀN THỐI LẠI"/"CHANGE"
            # - Calculate: due = cash - change
            
            # For now, we'll just ensure the amount is reasonable
            amount_value = result["amount"]["value"]
            
            # If amount seems too high (over 10M VND), flag for review
            if amount_value > 10000000:
                if "meta" not in result:
                    result["meta"] = {}
                if "warnings" not in result["meta"]:
                    result["meta"]["warnings"] = []
                
                result["meta"]["warnings"].append("amount_seems_high")
                result["meta"]["needs_review"] = True
            
            return result
            
        except Exception as e:
            logger.error(f"Cash/change guard failed: {e}")
            return result
    
    def _cleanup_items(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Clean up items array - drop uncertain items."""
        try:
            items = result.get("items", [])
            if not isinstance(items, list):
                result["items"] = []
                return result
            
            cleaned_items = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                
                name = item.get("name", "").strip()
                qty = item.get("qty", 1)
                
                # Drop items with empty name
                if not name:
                    continue
                
                # Ensure qty is valid
                if not isinstance(qty, int) or qty < 1:
                    qty = 1
                
                cleaned_items.append({
                    "name": name,
                    "qty": qty
                })
            
            result["items"] = cleaned_items
            return result
            
        except Exception as e:
            logger.error(f"Items cleanup failed: {e}")
            result["items"] = []
            return result
    
    def _finalize_meta(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Finalize metadata - ensure meta exists and warnings are deduplicated."""
        try:
            if "meta" not in result:
                result["meta"] = {}
            
            meta = result["meta"]
            
            # Ensure needs_review exists
            if "needs_review" not in meta:
                meta["needs_review"] = False
            
            # Deduplicate and limit warnings
            if "warnings" in meta and isinstance(meta["warnings"], list):
                warnings = list(set(meta["warnings"]))  # Remove duplicates
                warnings = [w for w in warnings if isinstance(w, str) and w.strip()]  # Filter valid strings
                meta["warnings"] = warnings[:3]  # Cap at 3 warnings
            else:
                meta["warnings"] = []
            
            return result
            
        except Exception as e:
            logger.error(f"Meta finalization failed: {e}")
            result["meta"] = {
                "needs_review": True,
                "warnings": ["post_processing_error"]
            }
            return result


# Global post-processor instance
post_processor = OcrPostProcessor()