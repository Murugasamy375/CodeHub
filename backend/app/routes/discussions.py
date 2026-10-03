import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.services.discussion_service import (
    add_connection,
    add_message,
    get_connections,
    get_messages,
    remove_connection,
)


logger = logging.getLogger("codehub.discussions")

router = APIRouter(
    tags=["Discussions"]
)


# --------------------------------------------------
# Supabase client
# --------------------------------------------------

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# --------------------------------------------------
# Authenticate WebSocket user
# --------------------------------------------------

async def authenticate_websocket(
    websocket: WebSocket,
):
    """
    Authenticate the user using the Supabase
    access token sent with the WebSocket connection.
    """

    token = websocket.query_params.get("token")

    if not token:
        return None

    try:

        response = supabase.auth.get_user(
            token
        )

        user = response.user

        if not user:
            return None

        metadata = user.user_metadata or {}

        full_name = metadata.get(
            "full_name"
        )

        if not full_name:
            full_name = (
                user.email or "User"
            )

        return {
            "id": user.id,
            "full_name": full_name,
        }

    except Exception:

        logger.exception(
            "DISCUSSION_AUTH_FAILED"
        )

        return None


# --------------------------------------------------
# Broadcast message
# --------------------------------------------------

async def broadcast_message(message):
    """
    Send a message to every connected user.
    """

    disconnected = []

    for websocket in get_connections():

        try:

            await websocket.send_json(
                {
                    "type": "message",
                    "data": message,
                }
            )

        except Exception:

            disconnected.append(
                websocket
            )

    for websocket in disconnected:

        remove_connection(
            websocket
        )


# --------------------------------------------------
# WebSocket endpoint
# --------------------------------------------------

@router.websocket(
    "/ws/discussions"
)
async def discussion_websocket(
    websocket: WebSocket,
):
    """
    Real-time daily discussion WebSocket.
    """

    # ----------------------------------------------
    # Authenticate
    # ----------------------------------------------

    user = await authenticate_websocket(
        websocket
    )

    if not user:

        await websocket.close(
            code=1008
        )

        logger.warning(
            "DISCUSSION_UNAUTHORIZED"
        )

        return

    # ----------------------------------------------
    # Accept connection
    # ----------------------------------------------

    await websocket.accept()

    add_connection(
        websocket
    )

    logger.info(
        "DISCUSSION_CONNECTED user_id=%s",
        user["id"],
    )

    try:

        # ------------------------------------------
        # Send today's messages
        # ------------------------------------------

        await websocket.send_json(
            {
                "type": "history",
                "data": get_messages(),
            }
        )

        # ------------------------------------------
        # Listen for messages
        # ------------------------------------------

        while True:

            data = (
                await websocket.receive_json()
            )

            message = data.get(
                "message"
            )

            # --------------------------------------
            # Validate message
            # --------------------------------------

            if not isinstance(
                message,
                str
            ):
                continue

            message = message.strip()

            # --------------------------------------
            # Ignore empty messages
            # --------------------------------------

            if not message:
                continue

            # --------------------------------------
            # Maximum message length
            # --------------------------------------

            if len(message) > 1000:

                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            "Message cannot exceed "
                            "1000 characters."
                        ),
                    }
                )

                continue

            # --------------------------------------
            # Store message
            # --------------------------------------

            created_message = add_message(
                user_id=user["id"],
                full_name=user["full_name"],
                message=message,
            )

            # --------------------------------------
            # Broadcast
            # --------------------------------------

            await broadcast_message(
                created_message
            )

    except WebSocketDisconnect:

        remove_connection(
            websocket
        )

        logger.info(
            "DISCUSSION_DISCONNECTED "
            "user_id=%s",
            user["id"],
        )

    except Exception as error:

        remove_connection(
            websocket
        )

        logger.exception(
            "DISCUSSION_ERROR "
            "user_id=%s error=%s",
            user["id"],
            error,
        )