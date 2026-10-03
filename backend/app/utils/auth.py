from fastapi import Header, HTTPException
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


async def get_current_user(
    authorization: str | None = Header(
        default=None
    )
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authorization header is required."
        )

    if not authorization.startswith(
        "Bearer "
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header."
        )

    access_token = (
        authorization.replace(
            "Bearer ",
            "",
            1
        ).strip()
    )

    if not access_token:

        raise HTTPException(
            status_code=401,
            detail="Access token is missing."
        )

    try:

        response = supabase.auth.get_user(
            access_token
        )

        user = response.user

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )

        return user

    except HTTPException:
        raise

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )