from datetime import date, time

from pydantic import BaseModel, Field, HttpUrl


class MeetingCreate(BaseModel):

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    meeting_date: date

    meeting_time: time

    meeting_link: HttpUrl