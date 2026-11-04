"""
OmniStore AI — FastAPI Backend Engine (v2.1.0)
Decoupled high-performance backend supporting real-time streaming,
multimodal processing (SAM 3.1 & Muse Spark 1.3), and agentic workflows.
"""
from __future__ import annotations

import httpx
import logging
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv

from backend.omnistore.auth_db import init_auth_db
from backend.omnistore.rate_limit import RateLimitMiddleware
from backend.omnistore.store_db import init_db, upsert_inventory, upsert_store

logger = logging.getLogger("omnistore.backend")

# Ensure backend root and project root are in sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(backend_dir), str(project_root)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Load environment variables
load_dotenv(backend_dir / ".env")
load_dotenv(project_root / ".env")

# Initialize databases on startup
init_db()
init_auth_db()

from backend.models.schemas import HealthResponse
from backend.services.meta_service import get_meta_service
from backend.services.queue_service import get_queue_manager
from backend.routers import auth as auth_router
from backend.routers import vision, agent, jobs, memory
from backend.routers import store as store_router

app = FastAPI(
    title="OmniStore AI Orchestrator",
    description="Physical-to-Digital Micro-Commerce Engine (Build for Your World) integrating SAM 3.1, Muse Spark 1.3, and Muse Code.",
    version="2.1.0",
)

# Rate limiting middleware (applied before CORS)
app.add_middleware(
    RateLimitMiddleware,
    max_requests=int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "120")),
    window_seconds=60,
)

# CORS Middleware
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://omnistore-sandy.vercel.app",
]
if allowed_origins_env and allowed_origins_env != "*":
    for origin in allowed_origins_env.split(","):
        cleaned = origin.strip()
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=None,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "x-meta-api-key"],
)

# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "internal server error",
        },
    )

# Register API Routers
app.include_router(vision.router)
app.include_router(agent.router)
app.include_router(jobs.router)
app.include_router(memory.router)
app.include_router(auth_router.router)
app.include_router(store_router.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background queue worker
    queue_mgr = get_queue_manager()
    print("\n" + "=" * 65)
    print(" 🏪 OmniStore AI Engine — Build for Your World (v2.1)")
    print(" 👁️  Eyes:    SAM 3.1 (Visual Perception & Spatial Segmentation)")
    print(" 🧠 Brain:   Muse Spark 1.3 (Cognitive Reasoning & Pricing)")
    print(" ✋ Hands:   Muse Code (Agentic Web Storefront Synthesis)")
    print(" ⚡ Ready on http://localhost:8000 (CORS -> http://localhost:3000)")
    print("=" * 65 + "\n")
    yield
    # Shutdown: Stop worker and close HTTP client sessions
    await queue_mgr.stop()
    meta_service = get_meta_service()
    await meta_service.close()


app.router.lifespan_context = lifespan


# Root & Health Endpoints
@app.get("/", tags=["General"])
async def root():
    return {
        "name": "OmniStore AI Orchestrator",
        "theme": "Build for Your World (Meta Global AI Developer Hackathon)",
        "version": "2.1.0",
        "docs_url": "/docs",
        "health_check": "/api/v1/health",
        "pipeline": {
            "eyes": "SAM 3.1 (Visual Perception & Segmentation)",
            "brain": "Muse Spark 1.3 (Cognitive Reasoning & Local Pricing)",
            "hands": "Muse Code (Agentic Web Synthesis & WhatsApp Checkout)",
        },
        "endpoints": {
            "end_to_end_scan": "POST /api/v1/scan",
            "visual_segmentation": "POST /api/v1/segment",
            "multimodal_reasoning": "POST /api/v1/reason",
            "storefront_code_gen": "POST /api/v1/code/generate",
            "streaming_assistant": "POST /api/v1/agent/chat",
            "background_jobs": "POST /api/v1/jobs",
            "auth_register": "POST /api/v1/auth/register",
            "auth_login": "POST /api/v1/auth/login",
            "auth_me": "GET /api/v1/auth/me",
            "store_list": "GET /api/v1/store",
            "store_get": "GET /api/v1/store/{slug}",
            "store_publish": "POST /api/v1/store/{slug}/publish",
        },
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    meta_key = bool(os.getenv("META_MODEL_API_KEY") or os.getenv("MODEL_API_KEY"))
    providers = {
        "meta_model_api": meta_key,
        "sam_3_1": False,
        "muse_spark_1_3": False,
        "muse_code": False,
        "background_queue": True,
        "cross_agent_memory": True,
    }
    overall = "healthy"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=2.0, read=3.0)) as client:
            try:
                r = await client.get("http://localhost:11434/api/tags")
                if r.status_code == 200:
                    providers["sam_3_1"] = True
                    providers["muse_spark_1_3"] = True
                    providers["muse_code"] = True
            except Exception:
                pass
    except Exception:
        pass
    if not any(providers[k] for k in ("sam_3_1", "muse_spark_1_3", "muse_code")):
        overall = "degraded"
    return HealthResponse(
        status=overall,
        assistant="OmniStore AI",
        version="2.1.0",
        active_providers=providers,
    )


def start(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """Start uvicorn server for OmniStore AI backend."""
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload)


def start_cli(voice: bool = False):
    from backend.core.agent_core import Agent, load_skills

    agent = Agent("fast", load_skills())
    print("\n[OmniStore AI CLI] Type your prompt, or Ctrl+C to exit.\n")
    while True:
        try:
            user_input = input("User> ")
            if not user_input.strip():
                continue
            import asyncio

            reply = asyncio.run(agent.run_turn(user_input))
            print(f"OmniStore> {reply}\n")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting CLI...")
            break


def main():
    import argparse

    parser = argparse.ArgumentParser(description="OmniStore AI Engine")
    parser.add_argument("--api", action="store_true", help="Start FastAPI HTTP Engine (default)")
    parser.add_argument("--cli", action="store_true", help="Terminal chat mode")
    parser.add_argument("--tui", action="store_true", help="Interactive Terminal UI")
    parser.add_argument("--desktop", action="store_true", help="Desktop orb overlay")
    parser.add_argument("--voice", action="store_true", help="Enable voice mode")
    args, _ = parser.parse_known_args()

    if args.cli:
        start_cli(voice=args.voice)
    elif args.tui:
        try:
            from backend.tui.hermes_tui import start_hermes_tui

            start_hermes_tui(voice_playback=args.voice)
        except Exception as e:
            print(f"Could not start TUI: {e}")
    elif args.desktop:
        try:
            print("Starting Desktop Orb...")
        except Exception as e:
            print(f"Desktop mode error: {e}")
    else:
        start()


if __name__ == "__main__":
    main()
