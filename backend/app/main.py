import logging
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.meeting import router as meeting_router
from app.routes.code import router as code_router
from app.routes.tasks import router as tasks_router
from app.routes.discussions import router as discussions_router
from app.routes.daily_challenge import (
    router as daily_challenge_router,
)
from app.routes.sql import router as sql_router
from app.routes.analytics import router as analytics_router
from app.routes.resources import router as resources_router
from app.routes.daily_code_submission import (
    router as daily_code_submission_router,
)
from app.routes.voice_submission import (
    router as voice_submission_router,
)
from app.routes.code_agent import (
    router as code_agent_router,
)
from app.routes.daily_code_submission import (
    router as daily_code_submission_router
)
from app.routes.profile import router as profile_router
# --------------------------------------------------
# Paths
# --------------------------------------------------
from app.routes.voice_analysis import (
    router as voice_analysis_router,
)
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

LOG_DIR = os.path.join(
    BASE_DIR,
    "logs"
)

os.makedirs(
    LOG_DIR,
    exist_ok=True
)

LOG_FILE = os.path.join(
    LOG_DIR,
    "app.log"
)


# --------------------------------------------------
# Logging
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s | "
        "%(levelname)-8s | "
        "%(name)s | "
        "%(message)s"
    ),
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(
            LOG_FILE,
            encoding="utf-8"
        ),
    ],
)

logger = logging.getLogger("codehub")


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="CodeHub API",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://code-hub-black.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# API Routers
# --------------------------------------------------

app.include_router(
    code_router
)

app.include_router(
    tasks_router
)

app.include_router(
    discussions_router
)
app.include_router(
    daily_challenge_router
)
app.include_router(meeting_router)
app.include_router(profile_router)
# --------------------------------------------------
# Health Check
# --------------------------------------------------
app.include_router(
    voice_submission_router
)
app.include_router(
    voice_analysis_router
)
app.include_router(
    code_agent_router
)
app.include_router(
    daily_code_submission_router
)
app.include_router(
    daily_code_submission_router
)
app.include_router(sql_router)
app.include_router(analytics_router)
app.include_router(resources_router)
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "codehub",
    }