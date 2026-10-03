import logging

from fastapi import APIRouter

from app.schemas.code import CodeRunRequest
from app.services.execution_service import execute_code


logger = logging.getLogger("codehub.code")


router = APIRouter(
    prefix="/api/code",
    tags=["Code Execution"],
)


@router.post("/run")
async def run_code(request: CodeRunRequest):

    logger.info(
        "CODE_RUN_REQUEST language=%s code_size=%d",
        request.language,
        len(request.code),
    )

    return await execute_code(
        language=request.language,
        code=request.code,
        stdin=request.stdin,
    )