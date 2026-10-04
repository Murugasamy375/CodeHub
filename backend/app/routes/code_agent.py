import logging

from fastapi import APIRouter, Depends

from app.schemas.code_agent import CodeAgentRequest

from app.services.code_agent_service import (
    chat_with_code_agent,
)

from app.utils.auth import get_current_user


logger = logging.getLogger(
    "codehub.code_agent.routes"
)


router = APIRouter(
    prefix="/api",
    tags=["Code Agent"],
)


@router.post("/code-agent/chat")
async def code_agent_chat(
    request: CodeAgentRequest,
    user=Depends(get_current_user),
):
    logger.info(
        "CODE_AGENT_CHAT user_id=%s",
        user.id,
    )

    result = chat_with_code_agent(
        request
    )

    return result