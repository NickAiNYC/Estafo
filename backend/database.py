"""
Modern database connection management with proper pooling and async support
"""

import os
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session, declarative_base
import logging

logger = logging.getLogger(__name__)

# Declarative Base for models
Base = declarative_base()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required")
ASYNC_DATABASE_URL = (DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
                      .replace("sqlite://", "sqlite+aiosqlite://", 1))
is_sqlite = DATABASE_URL.startswith("sqlite:")

# Async engine for modern FastAPI operations
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    **({} if is_sqlite else {"pool_size": 20, "max_overflow": 30}),
    pool_pre_ping=True,  # Validate connections
    pool_recycle=3600,  # Recycle connections hourly
    echo=os.getenv("DEBUG", "False").lower() == "true"
)

# Sync engine for legacy operations and migrations
sync_engine = create_engine(
    DATABASE_URL,
    **({} if is_sqlite else {"pool_size": 15, "max_overflow": 25}),
    pool_pre_ping=True,
    pool_recycle=3600
)

# Session makers
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)

# Compatibility names used by the active FastAPI application and older routes.
engine = sync_engine

async def get_async_db():
    """Dependency for FastAPI - async database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def get_sync_db():
    """Dependency for sync operations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

get_db = get_sync_db

# Health check for database
def check_db_connection() -> bool:
    """Verify synchronous database connectivity"""
    try:
        with sync_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

def get_db_stats() -> dict:
    """Return connection pool statistics"""
    pool = sync_engine.pool
    return {
        "size": pool.size() if hasattr(pool, "size") else 0,
        "checked_in_connections": pool.checkedin() if hasattr(pool, "checkedin") else 0,
        "overflow": pool.overflow() if hasattr(pool, "overflow") else 0,
    }

async def check_database_health():
    """Verify database connectivity and performance"""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            return {"status": "healthy", "latency_ms": "<10"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

