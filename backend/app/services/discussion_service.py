import logging

from datetime import datetime
from zoneinfo import ZoneInfo

from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


logger = logging.getLogger(
    "codehub.discussions.service"
)


# --------------------------------------------------
# Supabase client
# --------------------------------------------------

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# --------------------------------------------------
# WebSocket connections
# --------------------------------------------------

connected_users = set()


# --------------------------------------------------
# Application timezone
# --------------------------------------------------
#
# CodeHub uses India time for the discussion day.
#
# Therefore a new discussion day starts at
# 12:00 AM IST.
#
# --------------------------------------------------

APP_TIMEZONE = ZoneInfo(
    "Asia/Kolkata"
)


# --------------------------------------------------
# Get current date
# --------------------------------------------------

def get_today():
    return datetime.now(
        APP_TIMEZONE
    ).date()


# --------------------------------------------------
# Remove previous day's messages
# --------------------------------------------------

def cleanup_old_messages():

    today = get_today()

    try:

        response = (
            supabase
            .table("discussion_messages")
            .delete()
            .neq(
                "discussion_date",
                today.isoformat()
            )
            .execute()
        )

        logger.info(
            "DISCUSSION_OLD_MESSAGES_CLEANED "
            "current_date=%s",
            today,
        )

        return response.data or []

    except Exception as error:

        logger.exception(
            "DISCUSSION_CLEANUP_FAILED "
            "error=%s",
            error,
        )

        return []


# --------------------------------------------------
# Add WebSocket connection
# --------------------------------------------------

def add_connection(websocket):

    connected_users.add(
        websocket
    )

    logger.info(
        "DISCUSSION_CONNECTION_ADDED"
    )


# --------------------------------------------------
# Remove WebSocket connection
# --------------------------------------------------

def remove_connection(websocket):

    connected_users.discard(
        websocket
    )

    logger.info(
        "DISCUSSION_CONNECTION_REMOVED"
    )


# --------------------------------------------------
# Add discussion message
# --------------------------------------------------

def add_message(
    user_id: str,
    full_name: str,
    message: str,
):

    today = get_today()

    # Remove previous days first.
    cleanup_old_messages()

    data = {
        "user_id": user_id,
        "full_name": full_name,
        "message": message,
        "discussion_date": today.isoformat(),
    }

    try:

        response = (
            supabase
            .table("discussion_messages")
            .insert(data)
            .execute()
        )

        if not response.data:

            raise RuntimeError(
                "Discussion message was not saved."
            )

        created_message = (
            response.data[0]
        )

        logger.info(
            "DISCUSSION_MESSAGE_ADDED "
            "user_id=%s date=%s",
            user_id,
            today,
        )

        return created_message

    except Exception as error:

        logger.exception(
            "DISCUSSION_MESSAGE_SAVE_FAILED "
            "user_id=%s error=%s",
            user_id,
            error,
        )

        raise


# --------------------------------------------------
# Get today's messages
# --------------------------------------------------

def get_messages():

    today = get_today()

    # Clean previous days.
    cleanup_old_messages()

    try:

        response = (
            supabase
            .table("discussion_messages")
            .select(
                "id, user_id, full_name, "
                "message, discussion_date, "
                "created_at"
            )
            .eq(
                "discussion_date",
                today.isoformat()
            )
            .order(
                "created_at",
                desc=False
            )
            .execute()
        )

        messages = (
            response.data or []
        )

        logger.info(
            "DISCUSSION_MESSAGES_LOADED "
            "date=%s count=%s",
            today,
            len(messages),
        )

        return messages

    except Exception as error:

        logger.exception(
            "DISCUSSION_MESSAGES_LOAD_FAILED "
            "error=%s",
            error,
        )

        return []


# --------------------------------------------------
# Get connected users
# --------------------------------------------------

def get_connections():

    return list(
        connected_users
    )


# --------------------------------------------------
# Clear messages
# --------------------------------------------------

def clear_messages():

    today = get_today()

    try:

        response = (
            supabase
            .table("discussion_messages")
            .delete()
            .eq(
                "discussion_date",
                today.isoformat()
            )
            .execute()
        )

        logger.info(
            "DISCUSSION_MESSAGES_CLEARED "
            "date=%s",
            today,
        )

        return response.data or []

    except Exception as error:

        logger.exception(
            "DISCUSSION_MESSAGES_CLEAR_FAILED "
            "error=%s",
            error,
        )

        return []