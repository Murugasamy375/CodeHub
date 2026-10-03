import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


SUPABASE_URL = os.getenv(
    "SUPABASE_URL"
)

SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)


if not SUPABASE_URL:

    raise RuntimeError(
        "SUPABASE_URL is not configured. "
        f"Expected .env at: {ENV_FILE}"
    )


if not SUPABASE_SERVICE_ROLE_KEY:

    raise RuntimeError(
        "SUPABASE_SERVICE_ROLE_KEY "
        "is not configured."
    )