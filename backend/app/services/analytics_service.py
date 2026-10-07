import os

from fastapi import HTTPException
from supabase import create_client, Client


# =========================================================
# SUPABASE
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# =========================================================
# ADMIN CHECK
# =========================================================

def ensure_admin(user):
    result = (
        supabase
        .table("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=403,
            detail="Profile not found."
        )

    profile = result.data[0]

    if profile.get("is_active") is False:
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive."
        )

    if profile.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    return profile


# =========================================================
# ANALYTICS
# =========================================================

def get_admin_analytics(user):

    ensure_admin(user)

    # -----------------------------------------------------
    # REGISTERED USERS
    # -----------------------------------------------------

    profiles_result = (
        supabase
        .table("profiles")
        .select("id")
        .execute()
    )

    registered_users = len(
        profiles_result.data or []
    )

    # -----------------------------------------------------
    # DAILY CODE SUBMISSIONS
    # -----------------------------------------------------

    code_result = (
        supabase
        .table("daily_code_submissions")
        .select("id, user_id, status")
        .eq("status", "submitted")
        .execute()
    )

    code_submissions = code_result.data or []

    total_code_submissions = len(
        code_submissions
    )

    # Unique users who submitted at least once
    challenge_users = len(
        {
            submission["user_id"]
            for submission in code_submissions
            if submission.get("user_id")
        }
    )

    # -----------------------------------------------------
    # VOICE SUBMISSIONS
    # -----------------------------------------------------

    voice_result = (
        supabase
        .table("challenge_voice_submissions")
        .select("id, user_id")
        .execute()
    )

    voice_submissions = voice_result.data or []

    total_voice_submissions = len(
        voice_submissions
    )

    unique_voice_users = len(
        {
            submission["user_id"]
            for submission in voice_submissions
            if submission.get("user_id")
        }
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "registered_users": registered_users,

        "challenge_users": challenge_users,

        "total_code_submissions":
            total_code_submissions,

        "total_voice_submissions":
            total_voice_submissions,

        "unique_voice_users":
            unique_voice_users,
    }