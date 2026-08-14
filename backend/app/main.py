import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.router import api_router
from .services.runtime.engine import runtime_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch World Runtime Engine background worker
    logger.info("Starting Parallel AI World Runtime...")
    runtime_engine.start()
    yield
    # Teardown: Stop background worker
    logger.info("Stopping Parallel AI World Runtime...")
    runtime_engine.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Parallel AI World - Autonomous Intelligence Platform",
    version="0.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "0.4.0",
        "status": "online",
        "runtime": "active" if runtime_engine.worker.is_running else "idle",
        "docs": "/docs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
