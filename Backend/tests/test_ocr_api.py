"""
Integration tests for OCR Expense API endpoints.
"""

import pytest
import json
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.modules.ocr_expense.schemas import OcrExpenseHints


class TestOcrApi:
    """Integration tests for OCR API endpoints."""

    def test_health_check(self, client: TestClient):
        """Test OCR health check endpoint."""
        response = client.get("/api/v1/ocr/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ocr-expense"
        assert data["gemini_available"] is True

    def test_extract_expense_success(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str,
        sample_image_file: bytes,
        mock_gemini_response: dict
    ):
        """Test successful OCR expense extraction."""
        # Mock OCR service
        with patch('app.modules.ocr_expense.routes.ocr_expense_service') as mock_service:
            # Configure mock response
            mock_service.extract_expense_sync = AsyncMock(return_value={
                "job_id": "test-job-123",
                "session_id": test_session_id,
                "user_id": test_user_id,
                "filename": "test_receipt.jpg",
                "status": "completed",
                "created_at": "2025-01-09T10:00:00Z"
            })
            
            # Prepare request
            files = {"file": ("test_receipt.jpg", sample_image_file, "image/jpeg")}
            data = {
                "session_id": test_session_id,
                "user_id": test_user_id,
                "hints": json.dumps({"language": "vi", "timezone": "Asia/Ho_Chi_Minh"}),
                "debug": "false"
            }
            
            # Execute request
            response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert response_data["job_id"] == "test-job-123"
            assert response_data["session_id"] == test_session_id
            assert response_data["user_id"] == test_user_id
            assert response_data["filename"] == "test_receipt.jpg"
            assert response_data["status"] == "completed"
            
            # Verify service was called
            mock_service.extract_expense_sync.assert_called_once()

    def test_extract_expense_invalid_file_type(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test OCR extraction with invalid file type."""
        # Prepare request with invalid file type
        files = {"file": ("test.txt", b"text content", "text/plain")}
        data = {
            "session_id": test_session_id,
            "user_id": test_user_id
        }
        
        # Execute request
        response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
        
        # Should return 415 Unsupported Media Type
        assert response.status_code == 415
        response_data = response.json()
        assert response_data["code"] == "UNSUPPORTED_MEDIA_TYPE"

    def test_extract_expense_missing_file(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test OCR extraction with missing file."""
        data = {
            "session_id": test_session_id,
            "user_id": test_user_id
        }
        
        # Execute request without file
        response = client.post("/api/v1/ocr/expense:extract", data=data)
        
        # Should return 422 Unprocessable Entity
        assert response.status_code == 422

    def test_extract_expense_missing_session_id(
        self, 
        client: TestClient, 
        test_user_id: str, 
        sample_image_file: bytes
    ):
        """Test OCR extraction with missing session ID."""
        files = {"file": ("test_receipt.jpg", sample_image_file, "image/jpeg")}
        data = {
            "user_id": test_user_id
            # Missing session_id
        }
        
        # Execute request
        response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
        
        # Should return 422 Unprocessable Entity
        assert response.status_code == 422

    def test_extract_expense_missing_user_id(
        self, 
        client: TestClient, 
        test_session_id: str, 
        sample_image_file: bytes
    ):
        """Test OCR extraction with missing user ID."""
        files = {"file": ("test_receipt.jpg", sample_image_file, "image/jpeg")}
        data = {
            "session_id": test_session_id
            # Missing user_id
        }
        
        # Execute request
        response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
        
        # Should return 422 Unprocessable Entity
        assert response.status_code == 422

    def test_extract_expense_invalid_hints(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str, 
        sample_image_file: bytes
    ):
        """Test OCR extraction with invalid hints JSON."""
        files = {"file": ("test_receipt.jpg", sample_image_file, "image/jpeg")}
        data = {
            "session_id": test_session_id,
            "user_id": test_user_id,
            "hints": "invalid json"  # Invalid JSON
        }
        
        # Execute request
        response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
        
        # Should return 400 Bad Request
        assert response.status_code == 400
        response_data = response.json()
        assert response_data["code"] == "FILE_INVALID"

    def test_extract_expense_service_error(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str, 
        sample_image_file: bytes
    ):
        """Test OCR extraction with service error."""
        # Mock service error
        with patch('app.modules.ocr_expense.routes.ocr_expense_service') as mock_service:
            mock_service.extract_expense_sync = AsyncMock(
                side_effect=Exception("Service error")
            )
            
            files = {"file": ("test_receipt.jpg", sample_image_file, "image/jpeg")}
            data = {
                "session_id": test_session_id,
                "user_id": test_user_id
            }
            
            # Execute request
            response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
            
            # Should return 500 Internal Server Error
            assert response.status_code == 500
            response_data = response.json()
            assert response_data["code"] == "INTERNAL_ERROR"

    def test_extract_expense_with_hints(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str, 
        sample_image_file: bytes
    ):
        """Test OCR extraction with valid hints."""
        # Mock OCR service
        with patch('app.modules.ocr_expense.routes.ocr_expense_service') as mock_service:
            mock_service.extract_expense_sync = AsyncMock(return_value={
                "job_id": "test-job-123",
                "session_id": test_session_id,
                "user_id": test_user_id,
                "filename": "test_receipt.jpg",
                "status": "completed",
                "created_at": "2025-01-09T10:00:00Z"
            })
            
            # Prepare hints
            hints = {
                "language": "vi",
                "timezone": "Asia/Ho_Chi_Minh",
                "items_expected": True,
                "debug": True
            }
            
            files = {"file": ("test_receipt.jpg", sample_image_file, "image/jpeg")}
            data = {
                "session_id": test_session_id,
                "user_id": test_user_id,
                "hints": json.dumps(hints),
                "debug": "true"
            }
            
            # Execute request
            response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert response_data["job_id"] == "test-job-123"
            
            # Verify service was called with hints
            mock_service.extract_expense_sync.assert_called_once()
            call_args = mock_service.extract_expense_sync.call_args
            assert call_args[1]["hints"] is not None  # hints parameter should be passed

    def test_extract_expense_pdf_file(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test OCR extraction with PDF file."""
        # Mock OCR service
        with patch('app.modules.ocr_expense.routes.ocr_expense_service') as mock_service:
            mock_service.extract_expense_sync = AsyncMock(return_value={
                "job_id": "test-job-123",
                "session_id": test_session_id,
                "user_id": test_user_id,
                "filename": "test_receipt.pdf",
                "status": "completed",
                "created_at": "2025-01-09T10:00:00Z"
            })
            
            # Create mock PDF content
            pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n"
            
            files = {"file": ("test_receipt.pdf", pdf_content, "application/pdf")}
            data = {
                "session_id": test_session_id,
                "user_id": test_user_id
            }
            
            # Execute request
            response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
            
            # Assertions
            assert response.status_code == 200
            response_data = response.json()
            assert response_data["filename"] == "test_receipt.pdf"

    def test_extract_expense_large_file(
        self, 
        client: TestClient, 
        test_user_id: str, 
        test_session_id: str
    ):
        """Test OCR extraction with large file (should be rejected)."""
        # Create large file content (simulate oversized file)
        large_content = b"x" * (6 * 1024 * 1024)  # 6MB, exceeds 5MB limit
        
        files = {"file": ("large_receipt.jpg", large_content, "image/jpeg")}
        data = {
            "session_id": test_session_id,
            "user_id": test_user_id
        }
        
        # Execute request
        response = client.post("/api/v1/ocr/expense:extract", files=files, data=data)
        
        # Should return 400 Bad Request due to file size
        assert response.status_code == 400
        response_data = response.json()
        assert response_data["code"] == "FILE_INVALID"
