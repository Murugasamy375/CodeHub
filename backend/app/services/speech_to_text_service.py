import logging

from fastapi import HTTPException, UploadFile
from groq import Groq

from app.core.config import GROQ_API_KEY


logger = logging.getLogger(
    "codehub.speech_to_text.service"
)


groq_client = Groq(
    api_key=GROQ_API_KEY
)


MODEL_NAME = "whisper-large-v3"


async def transcribe_audio(
    audio: UploadFile,
) -> str:

    if not audio:
        raise HTTPException(
            status_code=400,
            detail="Audio recording is required.",
        )

    if not audio.content_type:
        raise HTTPException(
            status_code=400,
            detail="Unable to determine audio type.",
        )

    allowed_types = {
        "audio/webm",
        "audio/wav",
        "audio/wave",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
    }

    base_content_type = (
        audio.content_type
        .split(";")[0]
        .strip()
        .lower()
    )

    if base_content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format: "
                f"{audio.content_type}"
            ),
        )

    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Audio recording is empty.",
        )

    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Audio recording is too large.",
        )

    filename = audio.filename or "recording.webm"

    try:
        transcription = groq_client.audio.transcriptions.create(
            file=(
                filename,
                audio_bytes,
            ),
            model=MODEL_NAME,
            response_format="json",
            language="en",
            temperature=0.0,
        )

        transcript = (
            transcription.text or ""
        ).strip()

    except Exception as error:
        logger.error(
            "SPEECH_TO_TEXT_FAILED error=%s",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to transcribe voice recording.",
        )

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="No speech could be detected in the recording.",
        )

    logger.info(
        "SPEECH_TO_TEXT_SUCCESS characters=%s",
        len(transcript),
    )

    return transcript