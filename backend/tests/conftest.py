"""Pytest configuration and shared fixtures."""
import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

TEST_DB_PATH = "./test_suite.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
os.environ.setdefault("SECRET_KEY", "test-secret-key-12345")
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("DEV_FIXED_OTP", "123456")
os.environ.setdefault("GROQ_API_KEY", "test-key")
os.environ.setdefault("SARVAM_API_KEY", "test-key")
os.environ.setdefault("DATA_GOV_API_KEY", "test-key")

from app.db import Base, engine as app_engine, get_db, AsyncSessionLocal
from app.main import create_app


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    async with app_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield app_engine


@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def app(db_engine) -> FastAPI:
    """Create test app with overridden DB."""
    from sqlalchemy.ext.asyncio import async_sessionmaker

    session_factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    test_app = create_app()
    test_app.dependency_overrides[get_db] = override_get_db
    return test_app


@pytest_asyncio.fixture(scope="function")
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def auth_client(app: FastAPI, db_session: AsyncSession):
    """Client with a pre-authenticated user."""
    from app.models import User
    from app.auth.jwt import create_access_token

    user = User(
        id="test-user-id",
        mobile="9876543210",
        name="Test Farmer",
        village="Nashik",
        district="Nashik",
        state="Maharashtra",
        language="en",
        crops=["Onion"],
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    access_token, _ = create_access_token("test-user-id")

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {access_token}"},
    ) as ac:
        yield ac, user
