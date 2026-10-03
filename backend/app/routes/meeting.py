import logging

from fastapi import APIRouter, Depends
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.schemas.meeting import MeetingCreate

from app.services.meeting_service import (
    create_meeting,
    get_current_meeting,
    clear_current_meeting,
)

from app.utils.admin_auth import (
    get_current_admin,
)


logger = logging.getLogger(
    "codehub.meeting.routes"
)


router = APIRouter(
    prefix="/api",
    tags=["Meeting"],
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


@router.get("/meeting")
async def get_meeting():

    meeting = get_current_meeting()

    return {
        "meeting": meeting
    }


@router.post("/admin/meeting")
async def publish_meeting(
    meeting: MeetingCreate,
    admin=Depends(get_current_admin),
):

    logger.info(
        "ADMIN_PUBLISH_MEETING admin_id=%s",
        admin["id"],
    )

    created_meeting = create_meeting(
        admin_id=admin["id"],
        meeting=meeting,
    )

    return {
        "message": "Meeting published successfully.",
        "meeting": created_meeting,
    }


@router.delete("/admin/meeting")
async def remove_meeting(
    admin=Depends(get_current_admin),
):

    logger.info(
        "ADMIN_CLEAR_MEETING admin_id=%s",
        admin["id"],
    )

    return clear_current_meeting()