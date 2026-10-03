from pydantic import BaseModel, Field


class CodeRunRequest(BaseModel):
    language: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    stdin: str = ""