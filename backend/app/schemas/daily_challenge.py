from datetime import date

from pydantic import BaseModel, Field


class DailyChallengeCreate(BaseModel):
    challenge_date: date
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )
    questions_text: str = Field(
        ...,
        min_length=1,
    )