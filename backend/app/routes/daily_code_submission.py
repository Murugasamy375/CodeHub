import logging

from fastapi import APIRouter, Depends

from app.schemas.daily_code_submission import (
    DailyCodeSubmissionCreate,
)

from app.services.daily_code_submission_service import (
    submit_daily_code,
    get_daily_code_draft,
    save_daily_code_draft,
)

from app.utils.auth import get_current_user


# =========================================================
# LOGGER
# =========================================================

logger = logging.getLogger(
    "codehub.daily_code_submission.routes"
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api",
    tags=["Daily Code Submission"],
)


# =========================================================
# GET DAILY CODE DRAFT / SUBMISSION
# =========================================================

@router.get(
    "/challenge/{challenge_id}/code"
)
async def get_code_draft(
    challenge_id: str,
    user=Depends(get_current_user),
):
    logger.info(
        "USER_GET_DAILY_CODE_DRAFT "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user.id,
    )

    draft = get_daily_code_draft(
        challenge_id=challenge_id,
        user_id=user.id,
    )

    return {
        "draft": draft,
    }


# =========================================================
# SAVE DAILY CODE DRAFT
# =========================================================

@router.put(
    "/challenge/{challenge_id}/code/draft"
)
async def save_code_draft(
    challenge_id: str,
    submission: DailyCodeSubmissionCreate,
    user=Depends(get_current_user),
):
    logger.info(
        "USER_SAVE_DAILY_CODE_DRAFT "
        "challenge_id=%s user_id=%s language=%s",
        challenge_id,
        user.id,
        submission.language,
    )

    draft = save_daily_code_draft(
        challenge_id=challenge_id,
        user_id=user.id,
        submission=submission,
    )

    return {
        "message": "Draft saved successfully.",
        "draft": draft,
    }


# =========================================================
# FINAL DAILY CODE SUBMISSION
# =========================================================

@router.post(
    "/challenge/{challenge_id}/code"
)
async def submit_code(
    challenge_id: str,
    submission: DailyCodeSubmissionCreate,
    user=Depends(get_current_user),
):
    logger.info(
        "USER_SUBMIT_DAILY_CODE "
        "challenge_id=%s user_id=%s language=%s",
        challenge_id,
        user.id,
        submission.language,
    )

    result = submit_daily_code(
        challenge_id=challenge_id,
        user_id=user.id,
        submission=submission,
    )

    return {
        "message": "Code submitted successfully.",
        "submission": result["submission"],
        "streak": result["streak"],
    }