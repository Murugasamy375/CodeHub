from pydantic import BaseModel


class VoiceSubmissionResponse(BaseModel):
    id: str
    challenge_id: str
    user_id: str
    audio_url: str | None = None
    created_at: str