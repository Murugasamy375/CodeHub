import logging
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.routes.code import (
    router as code_router
)

from app.routes.tasks import (
    router as tasks_router
)


# =========================================
# LOGGING
# =========================================

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


logging.basicConfig(

    level=logging.INFO,

    format=(
        "%(asctime)s | "
        "%(levelname)-8s | "
        "%(name)s | "
        "%(message)s"
    ),

    handlers=[

        logging.StreamHandler(
            sys.stdout
        ),

        logging.FileHandler(
            LOG_FILE,
            encoding="utf-8"
        ),

    ],
)


logger = logging.getLogger(
    "codehub"
)


# =========================================
# FASTAPI
# =========================================

app = FastAPI(

    title="CodeHub API",

    version="1.0.0"

)


# =========================================
# CORS
# =========================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


# =========================================
# ROUTES
# =========================================

app.include_router(
    code_router
)


app.include_router(
    tasks_router
)


# =========================================
# HEALTH
# =========================================

@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "codehub"
    }