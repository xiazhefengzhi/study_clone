from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

from app.core.config import settings
from app.core.supabase_db import engine
from app.core.storage_init import init_storage
from app.api.v1 import api_router


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Connected to PostgreSQL (Supabase): {settings.DATABASE_URL.split('@')[1].split('/')[0]}")

    # Initialize Supabase Storage buckets
    logger.info("Initializing Supabase Storage Buckets...")
    storage_results = init_storage()

    if storage_results:
        success = sum(1 for v in storage_results.values() if v)
        total = len(storage_results)
        logger.info(f"Storage: {success}/{total} buckets ready")

    yield
    # Shutdown
    await engine.dispose()
    print("Closed PostgreSQL connection")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for uploaded images
static_dir = os.path.join(os.getcwd(), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
