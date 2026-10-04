import base64
import json
import logging

from fastapi import HTTPException
from groq import Groq
from supabase import create_client

from app.core.config import (
    GROQ_API_KEY,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.services.speech_to_text_service import (
    transcribe_audio,
)


logger = logging.getLogger(
    "codehub.voice_analysis.service"
)


# --------------------------------------------------
# Clients
# --------------------------------------------------

groq_client = Groq(
    api_key=GROQ_API_KEY
)

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# --------------------------------------------------
# Configuration
# --------------------------------------------------

VISION_MODEL = "qwen/qwen3.8-27b"

VOICE_BUCKET = "challenge-voice"
IMAGE_BUCKET = "challenge-images"


# --------------------------------------------------
# Get user's saved voice recording
# --------------------------------------------------

def get_user_voice_path(
    challenge_id: str,
    user_id: str,
) -> str:

    response = (
        supabase
        .table("challenge_voice_submissions")
        .select("audio_path")
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

    submissions = response.data or []

    if not submissions:
        raise HTTPException(
            status_code=404,
            detail="Voice recording not found.",
        )

    audio_path = submissions[0].get(
        "audio_path"
    )

    if not audio_path:
        raise HTTPException(
            status_code=404,
            detail="Voice recording path not found.",
        )

    return audio_path


# --------------------------------------------------
# Download user's voice recording
# --------------------------------------------------

def get_voice_file(
    audio_path: str,
):
    try:

        audio_bytes = (
            supabase
            .storage
            .from_(VOICE_BUCKET)
            .download(audio_path)
        )

        if not audio_bytes:
            raise HTTPException(
                status_code=404,
                detail="Voice recording is empty.",
            )

        return audio_bytes

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "VOICE_FILE_DOWNLOAD_FAILED "
            "path=%s error=%s",
            audio_path,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve voice recording.",
        )


# --------------------------------------------------
# Get challenge picture path
# --------------------------------------------------

def get_challenge_picture_path(
    challenge_id: str,
) -> str:

    response = (
        supabase
        .table("daily_challenges")
        .select(
            "id, picture_path"
        )
        .eq(
            "id",
            challenge_id,
        )
        .limit(1)
        .execute()
    )

    challenges = response.data or []

    if not challenges:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found.",
        )

    picture_path = challenges[0].get(
        "picture_path"
    )

    if not picture_path:
        raise HTTPException(
            status_code=404,
            detail="Challenge picture not found.",
        )

    return picture_path


# --------------------------------------------------
# Download challenge picture
# --------------------------------------------------

def get_challenge_picture(
    challenge_id: str,
):
    picture_path = (
        get_challenge_picture_path(
            challenge_id
        )
    )

    try:

        picture_bytes = (
            supabase
            .storage
            .from_(IMAGE_BUCKET)
            .download(picture_path)
        )

        if not picture_bytes:
            raise HTTPException(
                status_code=404,
                detail="Challenge picture is empty.",
            )

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "CHALLENGE_PICTURE_DOWNLOAD_FAILED "
            "path=%s error=%s",
            picture_path,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve challenge picture.",
        )

    # ----------------------------------------------
    # Determine image content type
    # ----------------------------------------------

    extension = (
        picture_path
        .split(".")[-1]
        .lower()
    )

    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }

    content_type = content_types.get(
        extension,
        "image/jpeg",
    )

    return picture_bytes, content_type


# --------------------------------------------------
# Analyze picture + transcript
# --------------------------------------------------

def analyze_picture_explanation(
    image_bytes: bytes,
    image_content_type: str,
    transcript: str,
):

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Challenge picture is empty.",
        )

    if not transcript or not transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Voice transcript is empty.",
        )

    # ----------------------------------------------
    # Convert image to base64
    # ----------------------------------------------

    image_base64 = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    image_url = (
        f"data:{image_content_type};base64,"
        f"{image_base64}"
    )

    # ----------------------------------------------
    # AI prompt
    # ----------------------------------------------

    prompt = f"""
You are an AI evaluator for a picture-description
speaking exercise.

The user was shown the provided picture and asked
to explain what they see.

Your job is ONLY to evaluate how well the user's
spoken explanation describes THIS picture.

Do NOT evaluate the user as a general English
speaker.

Focus mainly on whether the user's explanation
matches and describes the picture.

Evaluate:

1. Picture relevance
2. Important visual details mentioned
3. Important details that were missed
4. Useful vocabulary used
5. Words or expressions that could be improved
6. Clarity of explanation
7. Repeated or unnecessary words
8. Specific suggestions for improvement
9. Overall quality of the picture explanation

Be fair.

The user does NOT need to mention every tiny
detail in the image.

Do not invent objects or events that are not
clearly visible in the picture.

USER TRANSCRIPT:

{transcript}

Return ONLY valid JSON using exactly this structure:

{{
    "relevance": "...",

    "details_mentioned": [
        "..."
    ],

    "missing_details": [
        "..."
    ],

    "good_words": [
        "..."
    ],

    "words_to_improve": [
        "..."
    ],

    "clarity": "...",

    "improvements": [
        "..."
    ],

    "overall_feedback": "..."
}}
"""

    try:

        completion = (
            groq_client
            .chat
            .completions
            .create(
                model=VISION_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt,
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                },
                            },
                        ],
                    }
                ],
                temperature=0.2,
                max_completion_tokens=1200,
                response_format={
                    "type": "json_object"
                },
            )
        )

        content = (
            completion
            .choices[0]
            .message
            .content
        )

        if not content:
            raise HTTPException(
                status_code=500,
                detail="AI returned an empty response.",
            )

        feedback = json.loads(
            content
        )

        logger.info(
            "VOICE_PICTURE_ANALYSIS_SUCCESS"
        )

        return feedback

    except json.JSONDecodeError as error:

        logger.error(
            "VOICE_ANALYSIS_INVALID_JSON "
            "error=%s",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid analysis response.",
        )

    except HTTPException:
        raise

    except Exception as error:

        logger.error(
            "VOICE_PICTURE_ANALYSIS_FAILED "
            "error=%s",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to analyze picture explanation.",
        )


# --------------------------------------------------
# Main Voice AI Analysis
# --------------------------------------------------

async def analyze_user_voice_for_challenge(
    challenge_id: str,
    user_id: str,
):

    logger.info(
        "VOICE_AI_ANALYSIS_STARTED "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user_id,
    )

    # ----------------------------------------------
    # 1. Get user's saved voice path
    # ----------------------------------------------

    audio_path = get_user_voice_path(
        challenge_id=challenge_id,
        user_id=user_id,
    )

    # ----------------------------------------------
    # 2. Download voice recording
    # ----------------------------------------------

    audio_bytes = get_voice_file(
        audio_path
    )

    # ----------------------------------------------
    # 3. Convert voice → text
    # ----------------------------------------------

    from io import BytesIO

    class AudioForTranscription:

        def __init__(
            self,
            audio_bytes,
        ):
            self.filename = "recording.webm"
            self.content_type = "audio/webm"
            self._audio_bytes = audio_bytes

        async def read(self):
            return self._audio_bytes

    audio_file = AudioForTranscription(
        audio_bytes
    )

    transcript = await transcribe_audio(
        audio_file
    )

    # ----------------------------------------------
    # 4. Get admin's challenge picture
    # ----------------------------------------------

    picture_bytes, picture_content_type = (
        get_challenge_picture(
            challenge_id
        )
    )

    # ----------------------------------------------
    # 5. Analyze picture + transcript
    # ----------------------------------------------

    feedback = analyze_picture_explanation(
        image_bytes=picture_bytes,
        image_content_type=picture_content_type,
        transcript=transcript,
    )

    # ----------------------------------------------
    # IMPORTANT
    #
    # We DO NOT save:
    # - transcript
    # - feedback
    # - score
    # - AI review
    #
    # to Supabase.
    # ----------------------------------------------

    logger.info(
        "VOICE_AI_ANALYSIS_COMPLETED "
        "challenge_id=%s user_id=%s",
        challenge_id,
        user_id,
    )

    return {
        "transcript": transcript,
        "feedback": feedback,
    }