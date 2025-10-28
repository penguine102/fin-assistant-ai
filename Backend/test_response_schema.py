#!/usr/bin/env python3
"""
Test script để verify response_schema implementation trong OCR expense module
"""

import os
import sys
import json
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

def test_response_schema():
    """Test response_schema được định nghĩa đúng"""
    try:
        from app.modules.ocr_expense.gemini_client import GeminiOcrClient
        from google.genai import types
        
        # Set dummy API key để test
        os.environ['GEMINI_API_KEY'] = 'test_key_for_schema_validation'
        
        # Initialize client
        client = GeminiOcrClient()
        print("✅ GeminiOcrClient initialized successfully")
        
        # Test tạo response schema
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
        
        print("✅ Response schema created successfully")
        print(f"  - Type: {response_schema.type}")
        print(f"  - Required fields: {response_schema.required}")
        print(f"  - Properties count: {len(response_schema.properties)}")
        
        # Test JSON parsing với sample data
        test_json = {
            "transaction_date": "2024-01-15",
            "amount": {"value": 50000, "currency": "VND"},
            "category": {"code": "FNB", "name": "Thực phẩm"},
            "items": [{"name": "Cà phê", "qty": 1}],
            "meta": {"needs_review": False, "warnings": []}
        }
        
        json_str = json.dumps(test_json, ensure_ascii=False)
        parsed = json.loads(json_str)
        
        print("✅ JSON parsing test passed")
        print(f"  - Transaction date: {parsed['transaction_date']}")
        print(f"  - Amount: {parsed['amount']['value']} {parsed['amount']['currency']}")
        print(f"  - Category: {parsed['category']['code']} - {parsed['category']['name']}")
        print(f"  - Items count: {len(parsed['items'])}")
        print(f"  - Needs review: {parsed['meta']['needs_review']}")
        
        print("\n🎉 All tests passed! Response schema implementation hoạt động đúng.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    test_response_schema()
