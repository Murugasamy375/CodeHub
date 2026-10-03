import logging

from fastapi import HTTPException
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.schemas.meeting import MeetingCreate


logger = logging.getLogger(
    "codehub.meeting.service"
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


def get_current_meeting():

    response = (
        supabase
        .table("meetings")
        .select("*")
        .eq("is_active", True)
        .order(
            "meeting_date",
            desc=False
        )
        .order(
            "meeting_time",
            desc=False
        )
        .limit(1)
        .execute()
    )

    meetings = response.data or []

    if not meetings:
        return None

    return meetings[0]


def create_meeting(
    admin_id: str,
    meeting: MeetingCreate,
):

    # Deactivate the previous active meeting
    (
        supabase
        .table("meetings")
        .update({
            "is_active": False
        })
        .eq("is_active", True)
        .execute()
    )

    data = {
        "title": meeting.title,
        "meeting_date": (
            meeting.meeting_date.isoformat()
        ),
        "meeting_time": (
            meeting.meeting_time.isoformat()
        ),
        "meeting_link": str(
            meeting.meeting_link
        ),
        "is_active": True,
        "created_by": admin_id,
    }

    response = (
        supabase
        .table("meetings")
        .insert(data)
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=500,
            detail="Failed to create meeting.",
        )

    created_meeting = response.data[0]

    logger.info(
        "MEETING_CREATED id=%s admin_id=%s",
        created_meeting["id"],
        admin_id,
    )

    return created_meeting


def clear_current_meeting():

    (
        supabase
        .table("meetings")
        .update({
            "is_active": False
        })
        .eq("is_active", True)
        .execute()
    )

    logger.info(
        "CURRENT_MEETING_CLEARED"
    )

    return {
        "message": "Meeting removed successfully."
    }