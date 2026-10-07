from pydantic import BaseModel


class SQLExecuteRequest(BaseModel):
    query: str