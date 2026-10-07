from fastapi import APIRouter
from pydantic import BaseModel

from app.services.sql_service import (
    create_sql_session,
    execute_sql,
    close_sql_session,
)
from app.services.sql_service import (
    create_sql_session,
    execute_sql,
    get_tables,
    get_table_columns,
    close_sql_session,
)

router = APIRouter(
    prefix="/api/sql",
    tags=["SQL Editor"],
)


class SQLExecuteRequest(BaseModel):
    session_id: str
    query: str


class SQLSessionResponse(BaseModel):
    session_id: str


@router.post("/session")
async def create_session():

    session_id = create_sql_session()

    return {
        "success": True,
        "session_id": session_id,
    }


@router.post("/execute")
async def run_sql(request: SQLExecuteRequest):

    return execute_sql(
        request.session_id,
        request.query,
    )


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):

    close_sql_session(session_id)

    return {
        "success": True,
        "message": "SQL session closed.",
    }
@router.get("/tables/{session_id}")
async def get_sql_tables(session_id: str):

    from app.services.sql_service import get_tables

    return get_tables(session_id)
@router.get("/tables/{session_id}/{table_name}")
async def get_columns(
    session_id: str,
    table_name: str,
):
    return get_table_columns(
        session_id,
        table_name,
    )