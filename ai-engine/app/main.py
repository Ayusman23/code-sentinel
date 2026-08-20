import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.api.endpoints import router as api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("codesentinel")

settings = get_settings()

app = FastAPI(
    title="CodeSentinel AI Worker Plane",
    description="Automated AI DevSecOps & AST PR Review Engine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Latency logging middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
    return response

# Root & Health Endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.APP_NAME,
        "environment": settings.ENV,
        "gemini_model": settings.GEMINI_MODEL,
        "gemini_connected": bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_")),
        "fallback_heuristics_enabled": settings.ENABLE_FALLBACK_HEURISTICS,
        "timestamp": time.time()
    }

@app.get("/")
async def root():
    return {
        "name": "CodeSentinel AI Worker Plane",
        "docs": "/docs",
        "health": "/health",
        "status": "OPERATIONAL"
    }

# Include API Router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
