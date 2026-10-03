from fastapi import Depends, HTTPException
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.utils.auth import get_current_user


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


async def get_current_admin(
    user=Depends(get_current_user),
):

    response = (
        supabase
        .table("profiles")
        .select(
            "id, full_name, email, role, is_active"
        )
        .eq("id", user.id)
        .maybe_single()
        .execute()
    )

    profile = response.data

    if not profile:

        raise HTTPException(
            status_code=403,
            detail="User profile not found.",
        )

    if profile["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    if not profile["is_active"]:

        raise HTTPException(
            status_code=403,
            detail="Admin account is inactive.",
        )

    return profile