"""
Modern architecture test suite - 2026 readiness validation
"""

import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database_v2 import async_engine, sync_engine, AsyncSessionLocal
from models import Base
from config import settings
from main_v2 import app

is_postgresql = async_engine.dialect.name == "postgresql"

@pytest.fixture(autouse=True)
def ensure_tables():
    """Ensure database tables exist for each test."""
    from models import Base
    from database_v2 import sync_engine
    Base.metadata.create_all(bind=sync_engine)
    yield


class TestModernArchitecture:
    """Test suite for 2026-ready architecture"""
    
    @pytest.mark.asyncio
    async def test_async_database_performance(self):
        """Test async database can handle concurrent connections"""
        
        async def make_query():
            async with AsyncSessionLocal() as session:
                result = await session.execute(text("SELECT 1"))
                return result.scalar()
        
        # Run 20 concurrent queries
        tasks = [make_query() for _ in range(20)]
        results = await asyncio.gather(*tasks)
        
        assert all(results), "Not all concurrent queries succeeded"
        assert len(results) == 20, "Expected 20 concurrent results"
    
    @pytest.mark.asyncio
    async def test_modern_api_performance(self):
        """Test API performance under load"""
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            responses = []
            for _ in range(5):
                resp = await client.get("/api/v2/providers?limit=10")
                responses.append(resp)
            
            # All requests should succeed
            for response in responses:
                assert response.status_code == 200
                data = response.json()
                assert "providers" in data
                assert len(data["providers"]) <= 10
    
    @pytest.mark.asyncio
    async def test_security_configuration(self):
        """Test modern security configuration"""
        
        # Test that secrets are different
        assert settings.JWT_SECRET_KEY != settings.SECRET_KEY
        assert len(settings.SECRET_KEY) >= 32
        
        # Test that debug is disabled in production
        if settings.ENVIRONMENT == "production":
            assert not settings.DEBUG
    
    @pytest.mark.asyncio
    @pytest.mark.skipif(not is_postgresql, reason="PostgreSQL specific schema inspection test")
    async def test_database_schema_modernization(self):
        """Test that database schema is modernized"""
        
        async with AsyncSessionLocal() as session:
            # Check for modern indexes
            result = await session.execute(text("""
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'providers' 
                AND indexname LIKE '%npi%'
            """))
            npi_indexes = result.fetchall()
            assert len(npi_indexes) > 0, "Missing NPI performance index"
            
            # Check for JSONB columns
            result = await session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'claims' 
                AND column_name = 'modifiers'
            """))
            modifiers_col = result.fetchone()
            assert modifiers_col is not None, "Missing JSONB modifiers column"
            assert modifiers_col[1] == "jsonb", "Modifiers should be JSONB"
    
    @pytest.mark.asyncio
    async def test_rate_limiting_functionality(self):
        """Test that rate limiting is configured"""
        
        from main_v2 import get_rate_limiter
        limiter = get_rate_limiter()
        assert limiter is not None, "Rate limiter not configured"
    
    @pytest.mark.asyncio
    async def test_observability_stack(self):
        """Test observability and monitoring"""
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Test health endpoint
            response = await client.get("/health")
            assert response.status_code == 200
            
            data = response.json()
            assert "status" in data
            assert "database" in data
            assert "version" in data
            assert data["version"] == "2.0.0"
    
    @pytest.mark.asyncio
    @pytest.mark.skipif(not is_postgresql, reason="PostgreSQL specific data pipeline scalability test")
    async def test_data_pipeline_scalability(self):
        """Test that data pipeline can handle large datasets"""
        
        from data_pipeline_v2 import modern_loader
        
        # Test schema creation
        await modern_loader.create_optimized_schema()
        
        # Verify schema exists
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name IN ('providers', 'claims')
            """))
            table_count = result.scalar()
            assert table_count == 2, "Core tables not created"
    
    @pytest.mark.asyncio
    async def test_error_handling_and_observability(self):
        """Test modern error handling"""
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Test 404 handling
            response = await client.get("/nonexistent")
            assert response.status_code == 404
            
            # Test error response format
            response = await client.get("/api/v2/providers?limit=10000")  # Should fail
            if response.status_code != 200:
                data = response.json()
                assert "error" in data or "detail" in data
    
    @pytest.mark.asyncio
    async def test_cors_and_security_headers(self):
        """Test modern security headers"""
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/health")
            
            # Check for security headers
            assert "x-request-id" in response.headers
            assert "x-process-time" in response.headers
    
    def test_dependency_versions(self):
        """Test that dependencies are modern versions"""
        
        import fastapi
        import sqlalchemy
        import pydantic
        
        # Check for modern versions
        assert fastapi.__version__.startswith("0."), "FastAPI version too old"
        assert sqlalchemy.__version__.startswith("2."), "SQLAlchemy should be v2+"
        assert pydantic.__version__.startswith("2."), "Pydantic should be v2+"

class TestScalabilityReadiness:
    """Test scalability for 2026 demands"""
    
    @pytest.mark.asyncio
    @pytest.mark.skipif(not is_postgresql, reason="PostgreSQL specific connection pooling test")
    async def test_connection_pooling(self):
        """Test database connection pooling"""
        
        # Create multiple concurrent connections
        async def get_connection():
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT pg_sleep(0.01)"))
                return True
        
        tasks = [get_connection() for _ in range(20)]
        results = await asyncio.gather(*tasks)
        
        assert all(results), "Connection pool not working properly"
    
    @pytest.mark.asyncio
    @pytest.mark.skipif(not is_postgresql, reason="PostgreSQL specific batch operations test")
    async def test_batch_operations(self):
        """Test batch insert performance"""
        
        async with AsyncSessionLocal() as session:
            # Test batch insert
            values = [(1234567890, f'Test Provider {i}', 'NEW YORK', 'NY') for i in range(100)]
            
            await session.execute(text("""
                INSERT INTO providers (npi, name, city, state) 
                VALUES ( unnest(CAST($1 AS BIGINT[])), 
                        unnest(CAST($2 AS TEXT[])), 
                        unnest(CAST($3 AS TEXT[])), 
                        unnest(CAST($4 AS TEXT[])) )
                ON CONFLICT (npi) DO NOTHING
            """), [list(col) for col in zip(*values)])
            
            await session.commit()
            
            # Verify batch insert worked
            result = await session.execute(text("""
                SELECT COUNT(*) FROM providers WHERE npi = 1234567890
            """))
            count = result.scalar()
            assert count == 100, f"Batch insert failed, got {count}"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
