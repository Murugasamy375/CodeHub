import os
from datetime import date

from fastapi import HTTPException
from supabase import create_client

from app.schemas.daily_code_submission import (
    DailyCodeSubmissionCreate,
)
from app.services.streak_service import update_user_streak


# =========================================================
# SUPABASE
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# =========================================================
# SUBMIT DAILY CHALLENGE CODE
# =========================================================

def submit_daily_code(
    challenge_id: str,
    user_id: str,
    submission: DailyCodeSubmissionCreate,
):
    # --------------------------------------------------
    # 1. Get the challenge
    # --------------------------------------------------

    challenge_response = (
        supabase
        .table("daily_challenges")
        .select("id, challenge_date")
        .eq("id", challenge_id)
        .limit(1)
        .execute()
    )

    if (
        not challenge_response
        or not challenge_response.data
    ):
        raise HTTPException(
            status_code=404,
            detail="Daily challenge not found.",
        )

    challenge = challenge_response.data[0]

    challenge_date = date.fromisoformat(
        challenge["challenge_date"]
    )

    # --------------------------------------------------
    # 2. Check existing submission
    # --------------------------------------------------

    existing_response = (
        supabase
        .table("daily_code_submissions")
        .select("id, status")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    existing = (
        existing_response.data[0]
        if (
            existing_response
            and existing_response.data
        )
        else None
    )

    # --------------------------------------------------
    # 3. Don't allow duplicate final submission
    # --------------------------------------------------

    if (
        existing
        and existing.get("status") == "submitted"
    ):
        raise HTTPException(
            status_code=400,
            detail="This challenge has already been submitted.",
        )

    # --------------------------------------------------
    # 4. Save final submission
    # --------------------------------------------------

    data = {
        "challenge_id": challenge_id,
        "user_id": user_id,
        "language": submission.language,
        "code": submission.code,
        "status": "submitted",
    }

    response = (
        supabase
        .table("daily_code_submissions")
        .upsert(
            data,
            on_conflict="challenge_id,user_id",
        )
        .execute()
    )

    if (
        not response
        or not response.data
    ):
        raise HTTPException(
            status_code=500,
            detail="Failed to submit code.",
        )

    result = response.data[0]

    # --------------------------------------------------
    # 5. Update streak
    # --------------------------------------------------

    streak = update_user_streak(
        user_id=user_id,
        challenge_date=challenge_date,
    )

    # --------------------------------------------------
    # 6. Return submission + streak
    # --------------------------------------------------

    return {
        "submission": result,
        "streak": streak,
    }


# =========================================================
# GET USER'S DAILY CODE DRAFT
# =========================================================

def get_daily_code_draft(
    challenge_id: str,
    user_id: str,
):
    response = (
        supabase
        .table("daily_code_submissions")
        .select(
            "id,"
            "challenge_id,"
            "user_id,"
            "language,"
            "code,"
            "status,"
            "submitted_at,"
            "updated_at"
        )
        .eq(
            "challenge_id",
            challenge_id,
        )
        .eq(
            "user_id",
            user_id,
        )
        .limit(1)
        .execute()
    )

    # --------------------------------------------------
    # No submission/draft exists
    # --------------------------------------------------

    if (
        not response
        or not response.data
    ):
        return None

    # --------------------------------------------------
    # Return existing draft/submission
    # --------------------------------------------------

    return response.data[0]


# =========================================================
# SAVE / UPDATE DAILY CODE DRAFT
# =========================================================

def save_daily_code_draft(
    challenge_id: str,
    user_id: str,
    submission: DailyCodeSubmissionCreate,
):
    # --------------------------------------------------
    # 1. Verify challenge exists
    # --------------------------------------------------

    challenge_response = (
        supabase
        .table("daily_challenges")
        .select("id")
        .eq("id", challenge_id)
        .limit(1)
        .execute()
    )

    if (
        not challenge_response
        or not challenge_response.data
    ):
        raise HTTPException(
            status_code=404,
            detail="Daily challenge not found.",
        )

    # --------------------------------------------------
    # 2. Check existing submission
    # --------------------------------------------------

    existing_response = (
        supabase
        .table("daily_code_submissions")
        .select("id, status")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    existing = (
        existing_response.data[0]
        if (
            existing_response
            and existing_response.data
        )
        else None
    )

    # --------------------------------------------------
    # 3. Don't allow autosave after final submission
    # --------------------------------------------------

    if (
        existing
        and existing.get("status") == "submitted"
    ):
        raise HTTPException(
            status_code=400,
            detail="This challenge has already been submitted.",
        )

    # --------------------------------------------------
    # 4. Prepare draft
    # --------------------------------------------------

    data = {
        "challenge_id": challenge_id,
        "user_id": user_id,
        "language": submission.language,
        "code": submission.code,
        "status": "draft",
    }

    # --------------------------------------------------
    # 5. Save draft
    # --------------------------------------------------

    response = (
        supabase
        .table("daily_code_submissions")
        .upsert(
            data,
            on_conflict="challenge_id,user_id",
        )
        .execute()
    )

    if (
        not response
        or not response.data
    ):
        raise HTTPException(
            status_code=500,
            detail="Failed to save daily challenge draft.",
        )

    return response.data[0]