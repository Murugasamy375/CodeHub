from typing import Optional

from pydantic import BaseModel


class DailyCodeSubmissionCreate(BaseModel):
    language: str
    code: str
    status: Optional[str] = None


class DailyCodeSubmissionResponse(BaseModel):
    id: str
    challenge_id: str
    user_id: str
    language: str
    code: str
    status: Optional[str] = None
    submitted_at: str
    updated_at: str