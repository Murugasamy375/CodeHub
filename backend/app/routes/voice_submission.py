import logging

from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)

from app.services.voice_submission_service import (
    upload_voice_submission,
    get_user_voice_submission,
    delete_voice_submission,
    get_all_voice_submissions,
)

from app.utils.auth import (
    get_current_user,
)

from app.utils.admin_auth import (
    get_current_admin,
)


logger = logging.getLogger(
    "codehub.voice_submission.routes"
)


router = APIRouter(
    prefix="/api",
    tags=["Voice Submission"],
)


# =========================================================
# USER - GET OWN RECORDING
# =========================================================

@router.get(
    "/challenge/{challenge_id}/voice"
)
async def get_my_voice(
    challenge_id: str,
    user=Depends(get_current_user),
):
    submission = (
        get_user_voice_submission(
            challenge_id=challenge_id,
            user_id=user.id,
        )
    )

    return {
        "submission": submission
    }


# =========================================================
# USER - UPLOAD RECORDING
# =========================================================

@router.post(
    "/challenge/{challenge_id}/voice"
)
async def upload_voice(
    challenge_id: str,
    audio: UploadFile = File(...),
    user=Depends(get_current_user),
):
    logger.info(
        "USER_UPLOAD_VOICE "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user.id,
    )

    submission = (
        upload_voice_submission(
            challenge_id=challenge_id,
            user_id=user.id,
            audio=audio,
        )
    )

    return {
        "message": (
            "Voice recording saved successfully."
        ),
        "submission": submission,
    }


# =========================================================
# USER - DELETE RECORDING
# =========================================================

@router.delete(
    "/challenge/{challenge_id}/voice"
)
async def delete_voice(
    challenge_id: str,
    user=Depends(get_current_user),
):
    return delete_voice_submission(
        challenge_id=challenge_id,
        user_id=user.id,
    )


# =========================================================
# ADMIN - ALL RECORDINGS
# =========================================================

@router.get(
    "/admin/voice-recordings"
)
async def get_voice_recordings(
    admin=Depends(get_current_admin),
):
    logger.info(
        "ADMIN_GET_ALL_VOICE_RECORDINGS "
        "admin_id=%s",
        admin["id"],
    )

    submissions = (
        get_all_voice_submissions()
    )

    return {
        "submissions": submissions
    }