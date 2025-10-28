"""
Integration tests for Chat + OCR functionality.
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


class TestChatOcrIntegration:
    """Integration tests for Chat with OCR context."""

    def test_chat_without_ocr_context(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test chat without OCR context (normal chat flow)."""
        # Mock chat service to return normal response
        with patch('app.modules.chat.service.build_messages') as mock_build, \
             patch('app.modules.chat.service.ChatProviderClient') as mock_provider:
            
            # Configure mocks
            mock_build.return_value = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, how are you?"}
            ]
            mock_provider.return_value.completions = AsyncMock(return_value={
                "choices": [{"message": {"content": "I'm doing well, thank you!"}}]
            })
            
            # Prepare request
            data = {
                "user_id": test_user_id,
                "session_id": test_session_id,
                "query": "Hello, how are you?"
            }
            
            # Execute request
            response = client.post("/api/v1/chat/", json=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert "answer" in response_data

    def test_chat_with_ocr_context(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test chat with OCR context available."""
        # Mock OCR context
        ocr_context = {
            "transaction_date": "2025-01-09",
            "amount": {"value": 49200, "currency": "VND"},
            "category": {"code": "GRO", "name": "Tạp hoá"},
            "items": [{"name": "Snack vị tôm", "qty": 1}],
            "meta": {"warnings": []}
        }
        
        # Mock chat service with OCR context
        with patch('app.modules.chat.service.build_messages') as mock_build, \
             patch('app.modules.chat.service.ChatProviderClient') as mock_provider, \
             patch('app.modules.ocr_expense.service.ocr_expense_service') as mock_ocr:
            
            # Configure OCR service mock
            mock_ocr.get_ocr_context_by_session = AsyncMock(return_value=ocr_context)
            
            # Configure chat mocks
            mock_build.return_value = [
                {"role": "system", "content": "You are a helpful assistant.\n\nOCR Context Available:\n- Transaction Date: 2025-01-09\n- Amount: 49,200 VND\n- Category: Tạp hoá (GRO)\n- Items: 1 items\n\nBạn có thể trả lời câu hỏi về thông tin OCR này."},
                {"role": "user", "content": "Tôi vừa mua gì?"}
            ]
            mock_provider.return_value.completions = AsyncMock(return_value={
                "choices": [{"message": {"content": "Dựa trên hóa đơn bạn vừa upload, bạn đã mua Snack vị tôm với tổng tiền 49,200 VND."}}]
            })
            
            # Prepare request
            data = {
                "user_id": test_user_id,
                "session_id": test_session_id,
                "query": "Tôi vừa mua gì?"
            }
            
            # Execute request
            response = client.post("/api/v1/chat/", json=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert "answer" in response_data
            
            # Verify OCR context was retrieved
            mock_ocr.get_ocr_context_by_session.assert_called_once_with(
                mock_build.call_args[0][1], test_session_id
            )

    def test_chat_ocr_context_not_available(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test chat when OCR context is not available."""
        # Mock OCR service to return None (no context)
        with patch('app.modules.chat.service.build_messages') as mock_build, \
             patch('app.modules.chat.service.ChatProviderClient') as mock_provider, \
             patch('app.modules.ocr_expense.service.ocr_expense_service') as mock_ocr:
            
            # Configure OCR service mock to return None
            mock_ocr.get_ocr_context_by_session = AsyncMock(return_value=None)
            
            # Configure chat mocks
            mock_build.return_value = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, how are you?"}
            ]
            mock_provider.return_value.completions = AsyncMock(return_value={
                "choices": [{"message": {"content": "I'm doing well, thank you!"}}]
            })
            
            # Prepare request
            data = {
                "user_id": test_user_id,
                "session_id": test_session_id,
                "query": "Hello, how are you?"
            }
            
            # Execute request
            response = client.post("/api/v1/chat/", json=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert "answer" in response_data
            
            # Verify OCR context was checked
            mock_ocr.get_ocr_context_by_session.assert_called_once()

    def test_chat_ocr_context_error(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test chat when OCR context retrieval fails."""
        # Mock OCR service to raise exception
        with patch('app.modules.chat.service.build_messages') as mock_build, \
             patch('app.modules.chat.service.ChatProviderClient') as mock_provider, \
             patch('app.modules.ocr_expense.service.ocr_expense_service') as mock_ocr:
            
            # Configure OCR service mock to raise exception
            mock_ocr.get_ocr_context_by_session = AsyncMock(side_effect=Exception("OCR service error"))
            
            # Configure chat mocks
            mock_build.return_value = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, how are you?"}
            ]
            mock_provider.return_value.completions = AsyncMock(return_value={
                "choices": [{"message": {"content": "I'm doing well, thank you!"}}]
            })
            
            # Prepare request
            data = {
                "user_id": test_user_id,
                "session_id": test_session_id,
                "query": "Hello, how are you?"
            }
            
            # Execute request
            response = client.post("/api/v1/chat/", json=data)
            
            # Assertions - should still work despite OCR error
            assert response.status_code == 200
            response_data = response.json()
            assert "answer" in response_data

    def test_chat_with_ocr_items_context(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test chat with OCR context containing items."""
        # Mock OCR context with items
        ocr_context = {
            "transaction_date": "2025-01-09",
            "amount": {"value": 150000, "currency": "VND"},
            "category": {"code": "FNB", "name": "Thực phẩm"},
            "items": [
                {"name": "Bánh mì", "qty": 2},
                {"name": "Sữa tươi", "qty": 1},
                {"name": "Trứng gà", "qty": 10}
            ],
            "meta": {"warnings": []}
        }
        
        # Mock chat service with OCR context
        with patch('app.modules.chat.service.build_messages') as mock_build, \
             patch('app.modules.chat.service.ChatProviderClient') as mock_provider, \
             patch('app.modules.ocr_expense.service.ocr_expense_service') as mock_ocr:
            
            # Configure OCR service mock
            mock_ocr.get_ocr_context_by_session = AsyncMock(return_value=ocr_context)
            
            # Configure chat mocks
            mock_build.return_value = [
                {"role": "system", "content": "You are a helpful assistant.\n\nOCR Context Available:\n- Transaction Date: 2025-01-09\n- Amount: 150,000 VND\n- Category: Thực phẩm (FNB)\n- Items: 3 items\n\nItems:\n- Bánh mì (qty: 2)\n- Sữa tươi (qty: 1)\n- Trứng gà (qty: 10)\n\nBạn có thể trả lời câu hỏi về thông tin OCR này."},
                {"role": "user", "content": "Tôi mua những gì?"}
            ]
            mock_provider.return_value.completions = AsyncMock(return_value={
                "choices": [{"message": {"content": "Dựa trên hóa đơn, bạn đã mua: 2 bánh mì, 1 sữa tươi, và 10 trứng gà với tổng tiền 150,000 VND."}}]
            })
            
            # Prepare request
            data = {
                "user_id": test_user_id,
                "session_id": test_session_id,
                "query": "Tôi mua những gì?"
            }
            
            # Execute request
            response = client.post("/api/v1/chat/", json=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert "answer" in response_data
            
            # Verify OCR context was retrieved
            mock_ocr.get_ocr_context_by_session.assert_called_once()

    def test_chat_with_ocr_warnings(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test chat with OCR context containing warnings."""
        # Mock OCR context with warnings
        ocr_context = {
            "transaction_date": "2025-01-09",
            "amount": {"value": 49200, "currency": "VND"},
            "category": {"code": "GRO", "name": "Tạp hoá"},
            "items": [{"name": "Snack vị tôm", "qty": 1}],
            "meta": {
                "warnings": [
                    "Amount might be incorrect",
                    "Date format unclear"
                ]
            }
        }
        
        # Mock chat service with OCR context
        with patch('app.modules.chat.service.build_messages') as mock_build, \
             patch('app.modules.chat.service.ChatProviderClient') as mock_provider, \
             patch('app.modules.ocr_expense.service.ocr_expense_service') as mock_ocr:
            
            # Configure OCR service mock
            mock_ocr.get_ocr_context_by_session = AsyncMock(return_value=ocr_context)
            
            # Configure chat mocks
            mock_build.return_value = [
                {"role": "system", "content": "You are a helpful assistant.\n\nOCR Context Available:\n- Transaction Date: 2025-01-09\n- Amount: 49,200 VND\n- Category: Tạp hoá (GRO)\n- Items: 1 items\n\nItems:\n- Snack vị tôm (qty: 1)\n\n⚠️ Warnings:\n- Amount might be incorrect\n- Date format unclear\n\nBạn có thể trả lời câu hỏi về thông tin OCR này."},
                {"role": "user", "content": "Có vấn đề gì với hóa đơn không?"}
            ]
            mock_provider.return_value.completions = AsyncMock(return_value={
                "choices": [{"message": {"content": "Có một số cảnh báo với hóa đơn: số tiền có thể không chính xác và định dạng ngày không rõ ràng. Bạn nên kiểm tra lại."}}]
            })
            
            # Prepare request
            data = {
                "user_id": test_user_id,
                "session_id": test_session_id,
                "query": "Có vấn đề gì với hóa đơn không?"
            }
            
            # Execute request
            response = client.post("/api/v1/chat/", json=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert "answer" in response_data
