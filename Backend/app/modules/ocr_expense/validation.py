"""
JSON schema validation for OCR expense extraction results.
Implements validation according to the spec schema.
"""

import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class OcrSchemaValidator:
    """Validates OCR results against the spec schema."""
    
    def __init__(self):
        self.schema = self._load_schema()
    
    def _load_schema(self) -> Dict[str, Any]:
        """Load the JSON schema from spec."""
        return {
            "type": "object",
            "required": ["transaction_date", "amount", "category"],
            "additionalProperties": False,
            "properties": {
                "transaction_date": {
                    "type": "string",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                },
                "amount": {
                    "type": "object",
                    "required": ["value", "currency"],
                    "additionalProperties": False,
                    "properties": {
                        "value": {
                            "type": "integer",
                            "minimum": 0
                        },
                        "currency": {
                            "type": "string",
                            "enum": ["VND"]
                        }
                    }
                },
                "category": {
                    "type": "object",
                    "required": ["code", "name"],
                    "additionalProperties": False,
                    "properties": {
                        "code": {
                            "type": "string",
                            "enum": ["FNB", "GRO", "TRA", "UTI", "ENT", "OTH"]
                        },
                        "name": {
                            "type": "string",
                            "minLength": 1
                        }
                    }
                },
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["name"],
                        "properties": {
                            "name": {
                                "type": "string",
                                "minLength": 1
                            },
                            "qty": {
                                "type": "integer",
                                "minimum": 1
                            }
                        }
                    }
                },
                "meta": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "needs_review": {
                            "type": "boolean"
                        },
                        "warnings": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        }
    
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data against schema.
        
        Args:
            data: Data to validate
            
        Returns:
            Validation result with success status and errors
        """
        try:
            errors = []
            
            # Basic structure validation
            if not isinstance(data, dict):
                errors.append("Data must be an object")
                return {"valid": False, "errors": errors}
            
            # Check required fields
            required_fields = self.schema["required"]
            for field in required_fields:
                if field not in data:
                    errors.append(f"Missing required field: {field}")
            
            # Validate each field
            if "transaction_date" in data:
                errors.extend(self._validate_transaction_date(data["transaction_date"]))
            
            if "amount" in data:
                errors.extend(self._validate_amount(data["amount"]))
            
            if "category" in data:
                errors.extend(self._validate_category(data["category"]))
            
            if "items" in data:
                errors.extend(self._validate_items(data["items"]))
            
            if "meta" in data:
                errors.extend(self._validate_meta(data["meta"]))
            
            # Check for additional properties
            allowed_properties = set(self.schema["properties"].keys())
            for key in data.keys():
                if key not in allowed_properties:
                    errors.append(f"Additional property not allowed: {key}")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Schema validation failed: {e}")
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"]
            }
    
    def _validate_transaction_date(self, value: Any) -> List[str]:
        """Validate transaction_date field."""
        errors = []
        
        if not isinstance(value, str):
            errors.append("transaction_date must be a string")
            return errors
        
        import re
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', value):
            errors.append("transaction_date must match pattern YYYY-MM-DD")
        
        # Check if it's a valid date
        try:
            from datetime import datetime
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            errors.append("transaction_date must be a valid date")
        
        return errors
    
    def _validate_amount(self, value: Any) -> List[str]:
        """Validate amount field."""
        errors = []
        
        if not isinstance(value, dict):
            errors.append("amount must be an object")
            return errors
        
        # Check required fields
        if "value" not in value:
            errors.append("amount.value is required")
        elif not isinstance(value["value"], int) or value["value"] < 0:
            errors.append("amount.value must be a non-negative integer")
        
        if "currency" not in value:
            errors.append("amount.currency is required")
        elif value["currency"] != "VND":
            errors.append("amount.currency must be 'VND'")
        
        # Check for additional properties
        allowed_props = {"value", "currency"}
        for key in value.keys():
            if key not in allowed_props:
                errors.append(f"amount.{key} is not allowed")
        
        return errors
    
    def _validate_category(self, value: Any) -> List[str]:
        """Validate category field."""
        errors = []
        
        if not isinstance(value, dict):
            errors.append("category must be an object")
            return errors
        
        # Check required fields
        if "code" not in value:
            errors.append("category.code is required")
        elif value["code"] not in ["FNB", "GRO", "TRA", "UTI", "ENT", "OTH"]:
            errors.append("category.code must be one of: FNB, GRO, TRA, UTI, ENT, OTH")
        
        if "name" not in value:
            errors.append("category.name is required")
        elif not isinstance(value["name"], str) or len(value["name"]) < 1:
            errors.append("category.name must be a non-empty string")
        
        # Check for additional properties
        allowed_props = {"code", "name"}
        for key in value.keys():
            if key not in allowed_props:
                errors.append(f"category.{key} is not allowed")
        
        return errors
    
    def _validate_items(self, value: Any) -> List[str]:
        """Validate items field."""
        errors = []
        
        if not isinstance(value, list):
            errors.append("items must be an array")
            return errors
        
        for i, item in enumerate(value):
            if not isinstance(item, dict):
                errors.append(f"items[{i}] must be an object")
                continue
            
            # Check required fields
            if "name" not in item:
                errors.append(f"items[{i}].name is required")
            elif not isinstance(item["name"], str) or len(item["name"]) < 1:
                errors.append(f"items[{i}].name must be a non-empty string")
            
            # Check optional fields
            if "qty" in item:
                if not isinstance(item["qty"], int) or item["qty"] < 1:
                    errors.append(f"items[{i}].qty must be a positive integer")
            
            # Check for additional properties
            allowed_props = {"name", "qty"}
            for key in item.keys():
                if key not in allowed_props:
                    errors.append(f"items[{i}].{key} is not allowed")
        
        return errors
    
    def _validate_meta(self, value: Any) -> List[str]:
        """Validate meta field."""
        errors = []
        
        if not isinstance(value, dict):
            errors.append("meta must be an object")
            return errors
        
        # Check optional fields
        if "needs_review" in value:
            if not isinstance(value["needs_review"], bool):
                errors.append("meta.needs_review must be a boolean")
        
        if "warnings" in value:
            if not isinstance(value["warnings"], list):
                errors.append("meta.warnings must be an array")
            else:
                for i, warning in enumerate(value["warnings"]):
                    if not isinstance(warning, str):
                        errors.append(f"meta.warnings[{i}] must be a string")
        
        # Check for additional properties
        allowed_props = {"needs_review", "warnings"}
        for key in value.keys():
            if key not in allowed_props:
                errors.append(f"meta.{key} is not allowed")
        
        return errors
    
    def is_valid(self, data: Dict[str, Any]) -> bool:
        """Check if data is valid according to schema."""
        result = self.validate(data)
        return result["valid"]


# Global schema validator instance
schema_validator = OcrSchemaValidator()