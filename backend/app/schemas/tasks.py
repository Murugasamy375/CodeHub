from typing import Optional

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):

    title: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    description: Optional[str] = Field(
        default=None,
        max_length=2000
    )


class TaskUpdate(BaseModel):

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    description: Optional[str] = Field(
        default=None,
        max_length=2000
    )

    is_completed: Optional[bool] = None