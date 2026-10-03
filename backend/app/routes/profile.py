from fastapi import APIRouter, Depends
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


@router.get("/me")
async def get_my_profile(
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

    return {
        "profile": response.data
    }