import logging
import uuid

from fastapi import HTTPException, UploadFile

from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.schemas.daily_challenge import (
    DailyChallengeCreate,
)


logger = logging.getLogger(
    "codehub.daily_challenge.service"
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


BUCKET_NAME = "challenge-images"


# =========================================================
# GET CURRENT CHALLENGE
# =========================================================

def get_current_challenge():
    response = (
        supabase
        .table("daily_challenges")
        .select("*")
        .eq("status", "published")
        .order("published_at", desc=True)
        .limit(1)
        .execute()
    )

    challenges = response.data or []

    if not challenges:
        return None

    challenge = challenges[0]

    # -----------------------------------------------------
    # Generate temporary signed URL for private image
    # -----------------------------------------------------

    picture_path = challenge.get("picture_path")

    if picture_path:
        try:
            signed_response = (
                supabase
                .storage
                .from_(BUCKET_NAME)
                .create_signed_url(
                    picture_path,
                    3600,
                )
            )

            if signed_response:
                challenge["picture_url"] = (
                    signed_response.get("signedURL")
                    or signed_response.get("signedUrl")
                )

        except Exception as error:
            logger.error(
                "FAILED_TO_CREATE_PICTURE_URL error=%s",
                error,
            )

            challenge["picture_url"] = None

    else:
        challenge["picture_url"] = None

    return challenge


# =========================================================
# CREATE / PUBLISH CHALLENGE
# =========================================================

def create_challenge(
    admin_id: str,
    challenge: DailyChallengeCreate,
    picture: UploadFile,
):
    # -----------------------------------------------------
    # Validate picture
    # -----------------------------------------------------

    if not picture:
        raise HTTPException(
            status_code=400,
            detail="Challenge picture is required.",
        )

    if not picture.content_type:
        raise HTTPException(
            status_code=400,
            detail="Unable to determine picture type.",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if picture.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG and WEBP images "
                "are allowed."
            ),
        )

    # -----------------------------------------------------
    # Read picture
    # -----------------------------------------------------

    picture_bytes = picture.file.read()

    if not picture_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded picture is empty.",
        )

    # -----------------------------------------------------
    # Generate unique storage path
    # -----------------------------------------------------

    file_extension = (
        picture.filename
        .split(".")[-1]
        .lower()
        if picture.filename and "." in picture.filename
        else "png"
    )

    file_name = (
        f"{uuid.uuid4()}.{file_extension}"
    )

    storage_path = (
        f"{challenge.challenge_date.isoformat()}/"
        f"{file_name}"
    )

    # -----------------------------------------------------
    # Upload picture to Supabase Storage
    # -----------------------------------------------------

    try:
        supabase.storage.from_(
            BUCKET_NAME
        ).upload(
            path=storage_path,
            file=picture_bytes,
            file_options={
                "content-type": picture.content_type,
                "cache-control": "3600",
                "upsert": "false",
            },
        )

        logger.info(
            "CHALLENGE_PICTURE_UPLOADED path=%s",
            storage_path,
        )

    except Exception as error:
        logger.error(
            "CHALLENGE_PICTURE_UPLOAD_FAILED error=%s",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to upload challenge picture.",
        )

    # -----------------------------------------------------
    # Close previous published challenge
    # -----------------------------------------------------

    try:
        (
            supabase
            .table("daily_challenges")
            .update({
                "status": "closed",
            })
            .eq("status", "published")
            .execute()
        )

    except Exception as error:
        logger.error(
            "FAILED_TO_CLOSE_PREVIOUS_CHALLENGE error=%s",
            error,
        )

        # Remove uploaded picture because challenge
        # creation cannot continue.
        try:
            (
                supabase
                .storage
                .from_(BUCKET_NAME)
                .remove([storage_path])
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update previous challenge."
            ),
        )

    # -----------------------------------------------------
    # Insert new challenge
    # -----------------------------------------------------

    data = {
        "challenge_date": (
            challenge.challenge_date.isoformat()
        ),
        "title": challenge.title.strip(),
        "questions_text": (
            challenge.questions_text.strip()
        ),
        "picture_path": storage_path,
        "status": "published",
        "created_by": admin_id,
        "published_at": "now()",
    }

    # Supabase/PostgREST doesn't interpret the string
    # "now()" as SQL in a normal insert, so we remove
    # it and allow the DB default only if configured.
    data.pop("published_at")

    try:
        response = (
            supabase
            .table("daily_challenges")
            .insert(data)
            .execute()
        )

    except Exception as error:
        logger.error(
            "CHALLENGE_DATABASE_INSERT_FAILED error=%s",
            error,
        )

        try:
            (
                supabase
                .storage
                .from_(BUCKET_NAME)
                .remove([storage_path])
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="Failed to create daily challenge.",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Daily challenge was not created.",
        )

    created_challenge = response.data[0]

    logger.info(
        "CHALLENGE_CREATED id=%s admin_id=%s",
        created_challenge["id"],
        admin_id,
    )

    # -----------------------------------------------------
    # Add temporary picture URL
    # -----------------------------------------------------

    try:
        signed_response = (
            supabase
            .storage
            .from_(BUCKET_NAME)
            .create_signed_url(
                storage_path,
                3600,
            )
        )

        created_challenge["picture_url"] = (
            signed_response.get("signedURL")
            or signed_response.get("signedUrl")
        )

    except Exception:
        created_challenge["picture_url"] = None

    return created_challenge


# =========================================================
# CLOSE CURRENT CHALLENGE
# =========================================================

def clear_current_challenge():
    response = (
        supabase
        .table("daily_challenges")
        .update({
            "status": "closed",
        })
        .eq("status", "published")
        .execute()
    )

    logger.info(
        "CURRENT_CHALLENGE_CLEARED"
    )

    return {
        "message": "Challenge removed successfully."
    }