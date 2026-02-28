"""
CineForge AI — FastAPI Backend
Entry point: uvicorn main:app --reload --port 8000
"""
import logging
import logging.config

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from middleware import AuthMiddleware, LoggingMiddleware, RateLimitMiddleware
from routers import auth_router, projects_router, generation_router, callsheet_router, budget_router, shot_design_router, contacts_router
from services.db_service import ensure_indexes

# ── Logging setup ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("cineforge")

settings = get_settings()

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title="CineForge AI",
    description=(
        "AI-powered cinematic pre-production platform. "
        "Generate screenplays, shot breakdowns, and sound designs from a story premise."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware (order matters — outermost is first to run) ────
# 1. CORS  (must be first so preflight OPTIONS returns 200)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Request logger
app.add_middleware(LoggingMiddleware)

# 3. Rate limiter  (per IP, sliding window)
app.add_middleware(RateLimitMiddleware)

# 4. JWT auth guard  (skips /auth/*, /health, /docs, /redoc)
app.add_middleware(AuthMiddleware)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(generation_router)
app.include_router(callsheet_router)
app.include_router(budget_router)
app.include_router(shot_design_router)
app.include_router(contacts_router)


# ── Health check ──────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    """Create MongoDB indexes on first startup."""
    try:
        ensure_indexes()
        logger.info("MongoDB indexes ensured.")
    except Exception as exc:
        logger.warning("Could not ensure MongoDB indexes: %s", exc)


@app.get("/health", tags=["Health"], summary="Health check")
async def health():
    return {
        "status": "ok",
        "env":    settings.app_env,
        "database": "MongoDB",
        "llm":    {
            "primary":  f"HuggingFace ({settings.hf_model})" if settings.hf_api_token else "not configured",
            "fallback": f"Gemini ({settings.gemini_model})"  if settings.gemini_api_key else "not configured",
        },
    }


# ── Root ──────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "CineForge AI API is running. Visit /docs for the Swagger UI."}


# ── Dev runner ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.app_port, reload=True)
