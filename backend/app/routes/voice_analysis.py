import logging

from fastapi import APIRouter, Depends

from app.services.voice_analysis_service import (
    analyze_user_voice_for_challenge,
)

from app.utils.auth import get_current_user


logger = logging.getLogger(
    "codehub.voice_analysis.routes"
)


router = APIRouter(
    prefix="/api",
    tags=["Voice AI"],
)


@router.post(
    "/challenge/{challenge_id}/voice/analyze"
)
async def analyze_voice(
    challenge_id: str,
    user=Depends(get_current_user),
):
    logger.info(
        "VOICE_AI_ANALYSIS_STARTED "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user.id,
    )

    result = await analyze_user_voice_for_challenge(
        challenge_id=challenge_id,
        user_id=user.id,
    )

    logger.info(
        "VOICE_AI_ANALYSIS_COMPLETED "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user.id,
    )

    return result