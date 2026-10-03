import logging
import uuid

from fastapi import HTTPException, UploadFile
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


logger = logging.getLogger(
    "codehub.voice_submission.service"
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


BUCKET_NAME = "challenge-voice"


# =========================================================
# SIGNED URL
# =========================================================

def _create_signed_url(audio_path: str):
    try:
        response = (
            supabase
            .storage
            .from_(BUCKET_NAME)
            .create_signed_url(
                audio_path,
                3600,
            )
        )

        return (
            response.get("signedURL")
            or response.get("signedUrl")
        )

    except Exception as error:
        logger.error(
            "VOICE_SIGNED_URL_FAILED error=%s",
            error,
        )

        return None


# =========================================================
# GET USER'S VOICE
# =========================================================

def get_user_voice_submission(
    challenge_id: str,
    user_id: str,
):
    response = (
        supabase
        .table("challenge_voice_submissions")
        .select("*")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    submissions = response.data or []

    if not submissions:
        return None

    submission = submissions[0]

    submission["audio_url"] = (
        _create_signed_url(
            submission["audio_path"]
        )
    )

    return submission


# =========================================================
# UPLOAD / REPLACE VOICE
# =========================================================

def upload_voice_submission(
    challenge_id: str,
    user_id: str,
    audio: UploadFile,
):
    if not audio:
        raise HTTPException(
            status_code=400,
            detail="Voice recording is required.",
        )

    logger.info(
        "VOICE_UPLOAD_RECEIVED "
        "filename=%s content_type=%s",
        audio.filename,
        audio.content_type,
    )

    if not audio.content_type:
        raise HTTPException(
            status_code=400,
            detail="Unable to determine audio type.",
        )

    base_content_type = (
        audio.content_type
        .split(";")[0]
        .strip()
        .lower()
    )

    allowed_types = {
        "audio/webm",
        "audio/wav",
        "audio/wave",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
    }

    if base_content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format: "
                f"{audio.content_type}"
            ),
        )

    audio_bytes = audio.file.read()

    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Voice recording is empty.",
        )

    # -----------------------------------------------------
    # Existing submission
    # -----------------------------------------------------

    existing_response = (
        supabase
        .table("challenge_voice_submissions")
        .select("*")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    existing_submissions = (
        existing_response.data or []
    )

    existing_submission = (
        existing_submissions[0]
        if existing_submissions
        else None
    )

    # -----------------------------------------------------
    # Delete previous storage file
    # -----------------------------------------------------

    if existing_submission:
        old_path = existing_submission[
            "audio_path"
        ]

        try:
            (
                supabase
                .storage
                .from_(BUCKET_NAME)
                .remove([old_path])
            )

        except Exception as error:
            logger.warning(
                "OLD_VOICE_FILE_DELETE_FAILED "
                "path=%s error=%s",
                old_path,
                error,
            )

    # -----------------------------------------------------
    # Extension
    # -----------------------------------------------------

    if base_content_type == "audio/webm":
        file_extension = "webm"

    elif base_content_type in {
        "audio/wav",
        "audio/wave",
    }:
        file_extension = "wav"

    elif base_content_type == "audio/mpeg":
        file_extension = "mp3"

    elif base_content_type == "audio/mp4":
        file_extension = "mp4"

    elif base_content_type == "audio/ogg":
        file_extension = "ogg"

    else:
        file_extension = "webm"

    # -----------------------------------------------------
    # Storage path
    # -----------------------------------------------------

    file_name = (
        f"{uuid.uuid4()}.{file_extension}"
    )

    storage_path = (
        f"{challenge_id}/"
        f"{user_id}/"
        f"{file_name}"
    )

    # -----------------------------------------------------
    # Upload
    # -----------------------------------------------------

    try:
        (
            supabase
            .storage
            .from_(BUCKET_NAME)
            .upload(
                path=storage_path,
                file=audio_bytes,
                file_options={
                    "content-type": base_content_type,
                    "cache-control": "3600",
                    "upsert": "false",
                },
            )
        )

        logger.info(
            "VOICE_FILE_UPLOADED path=%s",
            storage_path,
        )

    except Exception as error:
        logger.error(
            "VOICE_UPLOAD_FAILED error=%s",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to upload voice recording.",
        )

    # -----------------------------------------------------
    # Database
    # -----------------------------------------------------

    try:

        if existing_submission:

            response = (
                supabase
                .table(
                    "challenge_voice_submissions"
                )
                .update({
                    "audio_path": storage_path,
                })
                .eq(
                    "id",
                    existing_submission["id"],
                )
                .execute()
            )

        else:

            response = (
                supabase
                .table(
                    "challenge_voice_submissions"
                )
                .insert({
                    "challenge_id": challenge_id,
                    "user_id": user_id,
                    "audio_path": storage_path,
                })
                .execute()
            )

    except Exception as error:

        logger.error(
            "VOICE_DATABASE_SAVE_FAILED "
            "error=%s",
            error,
        )

        try:
            (
                supabase
                .storage
                .from_(BUCKET_NAME)
                .remove([
                    storage_path
                ])
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="Failed to save voice submission.",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Voice submission was not saved.",
        )

    submission = response.data[0]

    submission["audio_url"] = (
        _create_signed_url(
            submission["audio_path"]
        )
    )

    logger.info(
        "VOICE_SUBMISSION_SAVED "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user_id,
    )

    return submission


# =========================================================
# DELETE USER VOICE
# =========================================================

def delete_voice_submission(
    challenge_id: str,
    user_id: str,
):
    response = (
        supabase
        .table("challenge_voice_submissions")
        .select("*")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    submissions = response.data or []

    if not submissions:
        raise HTTPException(
            status_code=404,
            detail="Voice recording not found.",
        )

    submission = submissions[0]

    try:
        (
            supabase
            .storage
            .from_(BUCKET_NAME)
            .remove([
                submission["audio_path"]
            ])
        )

    except Exception as error:
        logger.warning(
            "VOICE_FILE_DELETE_FAILED error=%s",
            error,
        )

    (
        supabase
        .table("challenge_voice_submissions")
        .delete()
        .eq(
            "id",
            submission["id"],
        )
        .execute()
    )

    logger.info(
        "VOICE_SUBMISSION_DELETED "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user_id,
    )

    return {
        "message": (
            "Voice recording deleted successfully."
        )
    }


# =========================================================
# ADMIN - ALL VOICE RECORDINGS
# =========================================================

def get_all_voice_submissions():
    """
    Return every voice submission.

    Includes:
    - challenge date
    - challenge title
    - challenge published date
    - user name
    - user email
    - recording
    """

    response = (
        supabase
        .table("challenge_voice_submissions")
        .select(
            """
            id,
            challenge_id,
            user_id,
            audio_path,
            created_at,
            updated_at
            """
        )
        .order(
            "created_at",
            desc=True,
        )
        .execute()
    )

    submissions = response.data or []

    if not submissions:
        return []

    # -----------------------------------------------------
    # Collect IDs
    # -----------------------------------------------------

    challenge_ids = list({
        submission["challenge_id"]
        for submission in submissions
    })

    user_ids = list({
        submission["user_id"]
        for submission in submissions
    })

    # -----------------------------------------------------
    # Fetch challenges
    # -----------------------------------------------------

    challenge_response = (
        supabase
        .table("daily_challenges")
        .select(
            """
            id,
            title,
            challenge_date,
            published_at
            """
        )
        .in_(
            "id",
            challenge_ids,
        )
        .execute()
    )

    challenges = (
        challenge_response.data or []
    )

    challenge_map = {
        challenge["id"]: challenge
        for challenge in challenges
    }

    # -----------------------------------------------------
    # Fetch profiles
    # -----------------------------------------------------

    profile_response = (
        supabase
        .table("profiles")
        .select(
            """
            id,
            full_name,
            email
            """
        )
        .in_(
            "id",
            user_ids,
        )
        .execute()
    )

    profiles = profile_response.data or []

    profile_map = {
        profile["id"]: profile
        for profile in profiles
    }

    # -----------------------------------------------------
    # Build final result
    # -----------------------------------------------------

    result = []

    for submission in submissions:

        challenge = challenge_map.get(
            submission["challenge_id"],
            {},
        )

        profile = profile_map.get(
            submission["user_id"],
            {},
        )

        submission["challenge"] = {
            "id": challenge.get("id"),
            "title": challenge.get(
                "title",
                "Unknown Challenge",
            ),
            "challenge_date": challenge.get(
                "challenge_date"
            ),
            "published_at": challenge.get(
                "published_at"
            ),
        }

        submission["profile"] = {
            "id": profile.get("id"),
            "full_name": profile.get(
                "full_name",
                "Unknown User",
            ),
            "email": profile.get(
                "email",
                "",
            ),
        }

        submission["audio_url"] = (
            _create_signed_url(
                submission["audio_path"]
            )
        )

        result.append(submission)

    # -----------------------------------------------------
    # Sort by challenge date first,
    # then submission time
    # -----------------------------------------------------

    result.sort(
        key=lambda item: (
            item["challenge"].get(
                "challenge_date"
            ) or "",
            item.get("created_at") or "",
        ),
        reverse=True,
    )

    return result