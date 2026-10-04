from typing import List, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CodeAgentRequest(BaseModel):
    message: str

    messages: List[ChatMessage] = Field(
        default_factory=list
    )