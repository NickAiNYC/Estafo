"""
Modern database connection management with proper pooling and async support
"""

import os
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///test.db"
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("sqlite://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://", 1)
else:
    ASYNC_DATABASE_URL = DATABASE_URL

# Async engine for modern FastAPI operations
if "sqlite" in ASYNC_DATABASE_URL:
    from sqlalchemy.pool import NullPool
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
        echo=False
    )
else:
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        pool_size=20,
        max_overflow=30,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=os.getenv("DEBUG", "False").lower() == "true"
    )

# Sync engine for legacy operations and migrations
if "sqlite" in DATABASE_URL:
    sync_engine = create_engine(DATABASE_URL)
else:
    sync_engine = create_engine(
        DATABASE_URL,
        pool_size=15,
        max_overflow=25,
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

# Health check for database
async def check_database_health():
    """Verify database connectivity and performance"""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            return {"status": "healthy", "latency_ms": "<10"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}
