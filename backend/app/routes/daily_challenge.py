import logging

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
)

from app.schemas.daily_challenge import (
    DailyChallengeCreate,
)

from app.services.daily_challenge_service import (
    create_challenge,
    get_current_challenge,
    clear_current_challenge,
)

from app.utils.admin_auth import (
    get_current_admin,
)


logger = logging.getLogger(
    "codehub.daily_challenge.routes"
)


router = APIRouter(
    prefix="/api",
    tags=["Daily Challenge"],
)


# =========================================================
# GET CURRENT CHALLENGE
# =========================================================

@router.get("/challenge")
async def get_challenge():

    challenge = get_current_challenge()

    return {
        "challenge": challenge
    }


# =========================================================
# ADMIN PUBLISH CHALLENGE
# =========================================================

@router.post("/admin/challenge")
async def publish_challenge(
    challenge_date: str = Form(...),
    title: str = Form(...),
    questions_text: str = Form(...),
    picture: UploadFile = File(...),
    admin=Depends(get_current_admin),
):

    logger.info(
        "ADMIN_PUBLISH_CHALLENGE admin_id=%s",
        admin["id"],
    )

    from datetime import date

    try:
        parsed_date = date.fromisoformat(
            challenge_date
        )
    except ValueError:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid challenge date. "
                "Use YYYY-MM-DD."
            ),
        )

    challenge_data = DailyChallengeCreate(
        challenge_date=parsed_date,
        title=title,
        questions_text=questions_text,
    )

    created_challenge = create_challenge(
        admin_id=admin["id"],
        challenge=challenge_data,
        picture=picture,
    )

    return {
        "message": (
            "Daily challenge published successfully."
        ),
        "challenge": created_challenge,
    }


# =========================================================
# ADMIN REMOVE CURRENT CHALLENGE
# =========================================================

@router.delete("/admin/challenge")
async def remove_challenge(
    admin=Depends(get_current_admin),
):

    logger.info(
        "ADMIN_CLEAR_CHALLENGE admin_id=%s",
        admin["id"],
    )

    return clear_current_challenge()