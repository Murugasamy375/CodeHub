import logging

from fastapi import APIRouter, Depends

from app.services.analytics_service import (
    get_admin_analytics,
)

from app.utils.auth import get_current_user


logger = logging.getLogger(
    "codehub.analytics.routes"
)


router = APIRouter(
    prefix="/api/admin/analytics",
    tags=["Admin Analytics"],
)


# =========================================================
# ADMIN ANALYTICS
# =========================================================

@router.get("")
async def admin_analytics(
    user=Depends(get_current_user),
):

    logger.info(
        "ADMIN_ANALYTICS user_id=%s",
        user.id,
    )

    return get_admin_analytics(user)