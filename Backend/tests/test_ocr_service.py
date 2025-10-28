"""
Unit tests for OCR Expense Service.
"""

import pytest
import uuid
from unittest.mock import Mock, AsyncMock, patch
from pathlib import Path
from fastapi import UploadFile

from app.modules.ocr_expense.service import OcrExpenseService
from app.modules.ocr_expense.exceptions import (
    FileValidationError, UnsupportedMediaTypeError, InternalError
)
from app.modules.ocr_expense.schemas import OcrExpenseHints


class TestOcrExpenseService:
    """Test cases for OcrExpenseService."""

    @pytest.fixture
    def service(self):
        """Create OCR service instance for testing."""
        return OcrExpenseService()

    @pytest.fixture
    def mock_upload_file(self):
        """Create mock upload file."""
        file = Mock(spec=UploadFile)
        file.filename = "test_receipt.jpg"
        file.content_type = "image/jpeg"
        file.size = 1024
        file.read = AsyncMock(return_value=b"fake_image_data")
        return file

    @pytest.fixture
    def mock_db_session(self):
        """Create mock database session."""
        session = AsyncMock()
        session.add = Mock()
        session.commit = AsyncMock()
        session.refresh = AsyncMock()
        return session

    def test_validate_file_success(self, service, mock_upload_file):
        """Test successful file validation."""
        # Should not raise any exception
        service._validate_file(mock_upload_file)

    def test_validate_file_no_filename(self, service):
        """Test file validation with no filename."""
        file = Mock(spec=UploadFile)
        file.filename = None
        file.content_type = "image/jpeg"
        
        with pytest.raises(FileValidationError, match="No filename provided"):
            service._validate_file(file)

    def test_validate_file_unsupported_type(self, service):
        """Test file validation with unsupported media type."""
        file = Mock(spec=UploadFile)
        file.filename = "test.txt"
        file.content_type = "text/plain"
        
        with pytest.raises(UnsupportedMediaTypeError, match="Unsupported media type"):
            service._validate_file(file)

    def test_get_file_extension(self, service):
        """Test file extension extraction."""
        assert service._get_file_extension("test.jpg") == ".jpg"
        assert service._get_file_extension("test.PNG") == ".png"
        assert service._get_file_extension("test") == ""

    @pytest.mark.asyncio
    async def test_save_file_success(self, service, mock_upload_file, temp_upload_dir):
        """Test successful file saving."""
        service.upload_dir = temp_upload_dir
        file_path = temp_upload_dir / "test.jpg"
        
        await service._save_file(mock_upload_file, file_path)
        
        assert file_path.exists()
        assert file_path.read_bytes() == b"fake_image_data"

    @pytest.mark.asyncio
    async def test_save_file_oversized(self, service, temp_upload_dir):
        """Test file saving with oversized file."""
        service.upload_dir = temp_upload_dir
        service.max_file_size = 100  # Small limit for testing
        
        file = Mock(spec=UploadFile)
        file.filename = "test.jpg"
        file.content_type = "image/jpeg"
        file.read = AsyncMock(return_value=b"x" * 200)  # Larger than limit
        
        file_path = temp_upload_dir / "test.jpg"
        
        with pytest.raises(FileValidationError, match="File size exceeds limit"):
            await service._save_file(file, file_path)

    @pytest.mark.asyncio
    async def test_extract_expense_sync_success(
        self, 
        service, 
        mock_db_session, 
        mock_upload_file, 
        temp_upload_dir,
        mock_gemini_response
    ):
        """Test successful synchronous OCR extraction."""
        # Setup
        service.upload_dir = temp_upload_dir
        session_id = "test-session-123"
        user_id = "test-user-123"
        
        # Mock dependencies
        with patch('app.modules.ocr_expense.service.preprocessor') as mock_prep, \
             patch('app.modules.ocr_expense.service.gemini_ocr_client') as mock_gemini, \
             patch('app.modules.ocr_expense.service.post_processor') as mock_post, \
             patch('app.modules.ocr_expense.service.schema_validator') as mock_validator:
            
            # Configure mocks
            mock_prep.preprocess_file = AsyncMock(return_value=b"processed")
            mock_gemini.extract_expense_data = AsyncMock(return_value=mock_gemini_response)
            mock_post.apply_rules = Mock(return_value=mock_gemini_response)
            mock_validator.validate = Mock()
            
            # Mock save_message
            with patch('app.modules.ocr_expense.service.save_message', new_callable=AsyncMock) as mock_save:
                
                # Execute
                result = await service.extract_expense_sync(
                    db=mock_db_session,
                    session_id=session_id,
                    user_id=user_id,
                    file=mock_upload_file,
                    hints=None,
                    profile="generic"
                )
                
                # Assertions
                assert result.job_id is not None
                assert result.session_id == session_id
                assert result.user_id == user_id
                assert result.filename == mock_upload_file.filename
                assert result.status == "completed"
                
                # Verify database operations
                mock_db_session.add.assert_called()
                mock_db_session.commit.assert_called()
                mock_db_session.refresh.assert_called()

    @pytest.mark.asyncio
    async def test_extract_expense_sync_file_validation_error(
        self, 
        service, 
        mock_db_session, 
        temp_upload_dir
    ):
        """Test OCR extraction with file validation error."""
        service.upload_dir = temp_upload_dir
        
        # Create invalid file
        file = Mock(spec=UploadFile)
        file.filename = None  # Invalid
        file.content_type = "image/jpeg"
        
        with pytest.raises(FileValidationError):
            await service.extract_expense_sync(
                db=mock_db_session,
                session_id="test-session",
                user_id="test-user",
                file=file,
                hints=None,
                profile="generic"
            )

    @pytest.mark.asyncio
    async def test_get_ocr_context_by_session_success(self, service, mock_db_session):
        """Test getting OCR context from session."""
        # Mock database query result
        mock_result = Mock()
        mock_result.transaction_date = "2025-01-09"
        mock_result.amount_value = 49200
        mock_result.amount_currency = "VND"
        mock_result.category_code = "GRO"
        mock_result.category_name = "Tạp hoá"
        mock_result.items_json = [{"name": "Snack vị tôm", "qty": 1}]
        mock_result.meta_json = {"needs_review": False, "warnings": []}
        mock_result.extracted_text_preview = "Test receipt"
        
        # Mock database execute
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = mock_result
        
        # Execute
        context = await service.get_ocr_context_by_session(mock_db_session, "test-session")
        
        # Assertions
        assert context is not None
        assert context["transaction_date"] == "2025-01-09"
        assert context["amount"]["value"] == 49200
        assert context["amount"]["currency"] == "VND"
        assert context["category"]["code"] == "GRO"
        assert context["category"]["name"] == "Tạp hoá"

    @pytest.mark.asyncio
    async def test_get_ocr_context_by_session_not_found(self, service, mock_db_session):
        """Test getting OCR context when no context exists."""
        # Mock empty database query result
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        
        # Execute
        context = await service.get_ocr_context_by_session(mock_db_session, "test-session")
        
        # Assertions
        assert context is None

    @pytest.mark.asyncio
    async def test_save_ocr_context_to_session(self, service, mock_db_session):
        """Test saving OCR context to session."""
        session_id = "test-session-123"
        user_id = "test-user-123"
        ocr_data = {
            "transaction_date": "2025-01-09",
            "amount": {"value": 49200, "currency": "VND"},
            "category": {"code": "GRO", "name": "Tạp hoá"},
            "items": [{"name": "Snack vị tôm", "qty": 1}],
            "meta": {"warnings": []}
        }
        
        # Mock save_message
        with patch('app.modules.ocr_expense.service.save_message', new_callable=AsyncMock) as mock_save:
            
            # Execute
            await service._save_ocr_context_to_session(
                mock_db_session, session_id, user_id, ocr_data
            )
            
            # Verify save_message was called
            mock_save.assert_called_once()
            args, kwargs = mock_save.call_args
            assert args[1] == session_id  # session_id is 2nd positional arg
            assert args[2] == user_id      # user_id is 3rd positional arg
            assert args[3] == "system"    # role is 4th positional arg
            assert "OCR Result:" in args[4]  # content is 5th positional arg

    @pytest.mark.asyncio
    async def test_extract_expense_sync_processing_error(
        self, 
        service, 
        mock_db_session, 
        mock_upload_file, 
        temp_upload_dir
    ):
        """Test OCR extraction with processing error."""
        service.upload_dir = temp_upload_dir
        
        # Mock processing error
        with patch('app.modules.ocr_expense.service.preprocessor') as mock_prep:
            mock_prep.process_file = AsyncMock(side_effect=Exception("Processing error"))
            
            with pytest.raises(InternalError, match="OCR extraction failed"):
                await service.extract_expense_sync(
                    db=mock_db_session,
                    session_id="test-session",
                    user_id="test-user",
                    file=mock_upload_file,
                    hints=None,
                    profile="generic"
                )
