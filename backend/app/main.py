"""FastAPI application factory with lifespan, CORS, middleware, and routers."""
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

# Configure structlog
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer() if settings.log_json else structlog.dev.ConsoleRenderer(),
    ]
)

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown."""
    from sqlalchemy import text, update
    from app.db import engine
    from app.db import Base, AsyncSessionLocal
    from app.models import Sabha  # import models to register them

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("database_tables_created")

    # Mark interrupted sabhas as failed
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Sabha)
            .where(Sabha.status == "running")
            .values(status="failed", error="interrupted by restart")
        )
        await db.commit()
    log.info("interrupted_sabhas_marked_failed")

    # Seed mandi directory if empty
    await _seed_if_empty()

    # Check Groq models
    if settings.groq_api_key:
        from app.services.llm.groq import fetch_available_models
        await fetch_available_models()

    # Warn on missing keys
    if not settings.data_gov_api_key:
        log.warning("DATA_GOV_API_KEY not set — will use fixture data")
    if not settings.groq_api_key:
        log.warning("GROQ_API_KEY not set — LLM calls will fail")

    log.info("app_started", env=settings.app_env)
    yield
    log.info("app_shutdown")


async def _seed_if_empty() -> None:
    """Seed mandi directory from CSV if table is empty."""
    import os
    from sqlalchemy import select, func
    from app.db import AsyncSessionLocal
    from app.models import Mandi

    # Always ensure all mandis from CSV are merged
    csv_path = "data/mandis_seed.csv"
    if not os.path.exists(csv_path):
        log.warning("mandis_seed_csv_not_found", path=csv_path, note="Run scripts/build_mandi_directory.py")
        return
        return

    import csv
    async with AsyncSessionLocal() as db:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                mandi = Mandi(
                    id=row["id"],
                    name=row["name"],
                    aliases=row.get("aliases", "").split("|") if row.get("aliases") else [],
                    state=row["state"],
                    district=row["district"],
                    lat=float(row["lat"]) if row.get("lat") else None,
                    lon=float(row["lon"]) if row.get("lon") else None,
                    coords_source=row.get("coords_source", "none"),
                    verified=row.get("verified", "false").lower() == "true",
                )
                await db.merge(mandi)
        await db.commit()
    log.info("mandis_seeded_from_csv", path=csv_path)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Mandi Sabha API",
        version="0.1.0",
        description="AI-powered agricultural mandi advisory system",
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Last-Event-ID", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

    # Request ID middleware
    @app.middleware("http")
    async def add_request_id(request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # Global error handler
    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
        log.error("unhandled_exception", error=str(exc), path=request.url.path)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "internal_error", "message": "An internal error occurred"}},
        )

    # Routers
    from app.routers.auth import router as auth_router
    from app.routers.me import router as me_router
    from app.routers.sabha import router as sabha_router
    from app.routers.markets import router as markets_router
    from app.routers.voice import router as voice_router
    from app.routers.health import router as health_router
    from app.routers.db_sync import router as db_sync_router

    app.include_router(auth_router)
    app.include_router(me_router)
    app.include_router(sabha_router)
    app.include_router(markets_router)
    app.include_router(voice_router)
    app.include_router(health_router)
    app.include_router(db_sync_router)

    return app


app = create_app()
