"""
Test configuration and fixtures for OCR expense tests.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock, patch
from pathlib import Path
import tempfile
import os

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import text

from app.main import application
from app.db.session import get_db
from app.modules.ocr_expense.models import OcrExpenseJob, OcrExpenseResult
from app.modules.chat.models import Session, Message


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Create test session factory
TestSessionLocal = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def init_db_schema(event_loop):
    """Ensure test DB schema is created once per session."""
    async def _create():
        async with test_engine.begin() as conn:
            # Enable FKs and create minimal tables used in tests
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql("PRAGMA foreign_keys=ON"))
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS users (id VARCHAR(36) PRIMARY KEY, username VARCHAR(255), email VARCHAR(255), created_at DATETIME)"))
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), session_name VARCHAR(255), created_at DATETIME, updated_at DATETIME, is_active BOOLEAN)"))
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS messages (id VARCHAR(36) PRIMARY KEY, session_id VARCHAR(36), user_id VARCHAR(36), role VARCHAR(20), content TEXT, created_at DATETIME, message_metadata JSON)"))
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS ocr_expense_jobs (id VARCHAR(36) PRIMARY KEY, session_id VARCHAR(36), user_id VARCHAR(36), original_filename VARCHAR(255), file_path VARCHAR(500), file_size INTEGER, content_type VARCHAR(100), profile VARCHAR(50), status VARCHAR(20), created_at DATETIME, completed_at DATETIME, error_message TEXT)"))
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS ocr_expense_results (id VARCHAR(36) PRIMARY KEY, job_id VARCHAR(36), transaction_date VARCHAR(10), amount_value INTEGER, amount_currency VARCHAR(10), category_code VARCHAR(10), category_name VARCHAR(50), items_json JSON, meta_json JSON, extracted_text_preview TEXT, processing_time REAL, created_at DATETIME)"))
    event_loop.run_until_complete(_create())

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as conn:
        # Import all models to ensure tables are created
        from app.modules.chat.models import Session, Message
        from app.modules.ocr_expense.models import OcrExpenseJob, OcrExpenseResult
        
        # Create all tables
        await conn.run_sync(lambda sync_conn: sync_conn.execute("PRAGMA foreign_keys=ON"))
        await conn.run_sync(lambda sync_conn: sync_conn.execute("CREATE TABLE IF NOT EXISTS users (id VARCHAR(36) PRIMARY KEY, username VARCHAR(255), email VARCHAR(255), created_at DATETIME)"))
        await conn.run_sync(lambda sync_conn: sync_conn.execute("CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), session_name VARCHAR(255), created_at DATETIME, updated_at DATETIME, is_active BOOLEAN)"))
        await conn.run_sync(lambda sync_conn: sync_conn.execute("CREATE TABLE IF NOT EXISTS messages (id VARCHAR(36) PRIMARY KEY, session_id VARCHAR(36), user_id VARCHAR(36), role VARCHAR(20), content TEXT, created_at DATETIME, message_metadata JSON)"))
        await conn.run_sync(lambda sync_conn: sync_conn.execute("CREATE TABLE IF NOT EXISTS ocr_expense_jobs (id VARCHAR(36) PRIMARY KEY, session_id VARCHAR(36), user_id VARCHAR(36), original_filename VARCHAR(255), file_path VARCHAR(500), file_size INTEGER, content_type VARCHAR(100), profile VARCHAR(50), status VARCHAR(20), created_at DATETIME, completed_at DATETIME, error_message TEXT)"))
        await conn.run_sync(lambda sync_conn: sync_conn.execute("CREATE TABLE IF NOT EXISTS ocr_expense_results (id VARCHAR(36) PRIMARY KEY, job_id VARCHAR(36), transaction_date VARCHAR(10), amount_value INTEGER, amount_currency VARCHAR(10), category_code VARCHAR(10), category_name VARCHAR(50), items_json JSON, meta_json JSON, extracted_text_preview TEXT, processing_time REAL, created_at DATETIME)"))
    
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
def client(event_loop):
    """Create a test client with database session override (sync fixture returning TestClient)."""
    async def override_get_db():
        async with TestSessionLocal() as session:
            try:
                yield session
            finally:
                await session.rollback()

    application.dependency_overrides[get_db] = override_get_db

    # Seed base data once for known test IDs
    async def _seed():
        async with TestSessionLocal() as s:
            await s.execute(
                text("INSERT OR IGNORE INTO users (id, username, email, created_at) VALUES (:id, :username, :email, :created_at)"),
                {"id": "test-user-123", "username": "testuser", "email": "test@example.com", "created_at": "2025-01-01 00:00:00"}
            )
            await s.execute(
                text("INSERT OR IGNORE INTO sessions (id, user_id, session_name, created_at, updated_at, is_active) VALUES (:id, :user_id, :name, :created_at, :updated_at, :is_active)"),
                {"id": "test-session-123", "user_id": "test-user-123", "name": "Test Session", "created_at": "2025-01-01 00:00:00", "updated_at": "2025-01-01 00:00:00", "is_active": True}
            )
            await s.commit()

    event_loop.run_until_complete(_seed())

    with TestClient(application) as test_client:
        yield test_client

    application.dependency_overrides.clear()


@pytest.fixture
def test_user_id() -> str:
    """Return a test user ID."""
    return "test-user-123"


@pytest.fixture
def test_session_id() -> str:
    """Return a test session ID."""
    return "test-session-123"


@pytest.fixture
async def test_user(db_session: AsyncSession, test_user_id: str) -> dict:
    """Create a test user via raw SQL insert (no ORM model)."""
    await db_session.execute(
        # Minimal columns to satisfy FK constraints
        # created_at can be NULL in our simple test table
        # If not, insert a timestamp string
        # Using SQLite, DATETIME accepts text
        
        # language=SQL
        text("INSERT INTO users (id, username, email, created_at) VALUES (:id, :username, :email, :created_at)")
        , {"id": test_user_id, "username": "testuser", "email": "test@example.com", "created_at": "2025-01-01 00:00:00"}
    )
    await db_session.commit()
    return {"id": test_user_id, "username": "testuser", "email": "test@example.com"}


@pytest.fixture
async def test_session(db_session: AsyncSession, test_user_id: str, test_session_id: str) -> Session:
    """Create a test session."""
    session = Session(
        id=test_session_id,
        user_id=test_user_id,
        session_name="Test Session"
    )
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)
    return session


@pytest.fixture
def sample_image_file() -> bytes:
    """Create a sample image file for testing."""
    # Create a simple 1x1 pixel PNG image
    return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'


@pytest.fixture
def mock_gemini_response() -> dict:
    """Mock Gemini API response."""
    return {
        "transaction_date": "2025-01-09",
        "amount": {
            "value": 49200,
            "currency": "VND"
        },
        "category": {
            "code": "GRO",
            "name": "Tạp hoá"
        },
        "items": [
            {
                "name": "Snack vị tôm",
                "qty": 1
            }
        ],
        "meta": {
            "needs_review": False,
            "warnings": []
        }
    }


@pytest.fixture
def temp_upload_dir() -> Generator[Path, None, None]:
    """Create a temporary upload directory for testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


@pytest.fixture
def mock_ocr_service():
    """Mock OCR service for testing."""
    with patch('app.modules.ocr_expense.service.ocr_expense_service') as mock:
        yield mock


@pytest.fixture
def mock_gemini_client():
    """Mock Gemini client for testing."""
    with patch('app.modules.ocr_expense.service.gemini_ocr_client') as mock:
        mock.extract_expense_data = AsyncMock(return_value={
            "transaction_date": "2025-01-09",
            "amount": {"value": 49200, "currency": "VND"},
            "category": {"code": "GRO", "name": "Tạp hoá"},
            "items": [{"name": "Snack vị tôm", "qty": 1}],
            "meta": {"needs_review": False, "warnings": []}
        })
        yield mock


@pytest.fixture
def mock_preprocessor():
    """Mock preprocessor for testing."""
    with patch('app.modules.ocr_expense.service.preprocessor') as mock:
        mock.process_file = AsyncMock(return_value=(b"processed_image", "image/jpeg"))
        yield mock


@pytest.fixture
def mock_postprocessor():
    """Mock postprocessor for testing."""
    with patch('app.modules.ocr_expense.service.post_processor') as mock:
        mock.apply_rules = Mock(return_value={
            "transaction_date": "2025-01-09",
            "amount": {"value": 49200, "currency": "VND"},
            "category": {"code": "GRO", "name": "Tạp hoá"},
            "items": [{"name": "Snack vị tôm", "qty": 1}],
            "meta": {"needs_review": False, "warnings": []}
        })
        yield mock


@pytest.fixture
def mock_validator():
    """Mock validator for testing."""
    with patch('app.modules.ocr_expense.service.schema_validator') as mock:
        mock.validate = Mock()
        yield mock
