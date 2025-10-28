from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
import logging


def _mask_dsn(dsn: str) -> str:
    try:
        # postgresql+asyncpg://user:pass@host:port/db
        if "@" in dsn and "://" in dsn:
            scheme, rest = dsn.split("://", 1)
            creds, tail = rest.split("@", 1)
            if ":" in creds:
                user, _ = creds.split(":", 1)
                return f"{scheme}://{user}:***@{tail}"
    except Exception:
        pass
    return dsn


def _get_database_url() -> str:
    # Always use PostgreSQL (asyncpg). Build from split envs if needed.
    print("🔍 DEBUG: _get_database_url() called")
    print(f"🔍 DEBUG: settings.DATABASE_URL = {settings.DATABASE_URL}")
    print(f"🔍 DEBUG: settings.DB_HOST = {settings.DB_HOST}")
    print(f"🔍 DEBUG: settings.DB_USER = {settings.DB_USER}")
    print(f"🔍 DEBUG: settings.DB_PASSWORD = {settings.DB_PASSWORD}")
    print(f"🔍 DEBUG: settings.DB_NAME = {settings.DB_NAME}")
    print(f"🔍 DEBUG: settings.DB_PORT = {settings.DB_PORT}")
    
    if settings.DATABASE_URL:
        print("🔍 DEBUG: Using DATABASE_URL")
        return settings.DATABASE_URL
    
    host = settings.DB_HOST or "db"
    user = settings.DB_USER or "postgres"
    password = settings.DB_PASSWORD or "postgres"
    name = settings.DB_NAME or "postgres"
    port = settings.DB_PORT or 5432
    
    url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"
    print(f"🔍 DEBUG: Built database URL: {url}")
    return url


logger = logging.getLogger(__name__)

database_url = _get_database_url()
logger.info("Database DSN: %s", _mask_dsn(database_url))

engine: AsyncEngine = create_async_engine(database_url, echo=False, future=True)

AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False, autocommit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
 
 
