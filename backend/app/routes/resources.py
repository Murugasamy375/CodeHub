import logging
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
)

from app.services.resource_service import (
    create_resource,
    delete_resource,
    get_resources,
)
from app.utils.auth import get_current_user


logger = logging.getLogger(
    "codehub.resources.routes"
)

router = APIRouter(
    prefix="/api/resources",
    tags=["Learning Resources"],
)


# =========================================================
# GET RESOURCES
# =========================================================

@router.get("")
async def list_resources(
    category: Optional[str] = None,
    topic: Optional[str] = None,
):
    logger.info(
        "GET_RESOURCES category=%s topic=%s",
        category,
        topic,
    )

    resources = get_resources(
        category=category,
        topic=topic,
    )

    return {
        "resources": resources,
    }


# =========================================================
# ADMIN CREATE RESOURCE
# =========================================================

@router.post("/admin")
async def add_resource(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form(...),
    topic: str = Form(...),
    resource_type: str = Form(...),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user=Depends(get_current_user),
):
    logger.info(
        "ADMIN_CREATE_RESOURCE "
        "user_id=%s category=%s topic=%s type=%s",
        user.id,
        category,
        topic,
        resource_type,
    )

    resource = await create_resource(
        user=user,
        title=title,
        description=description,
        category=category,
        topic=topic,
        resource_type=resource_type,
        url=url,
        file=file,
    )

    return {
        "message": "Resource added successfully.",
        "resource": resource,
    }


# =========================================================
# ADMIN DELETE RESOURCE
# =========================================================

@router.delete("/admin/{resource_id}")
async def remove_resource(
    resource_id: str,
    user=Depends(get_current_user),
):
    logger.info(
        "ADMIN_DELETE_RESOURCE "
        "resource_id=%s user_id=%s",
        resource_id,
        user.id,
    )

    result = delete_resource(
        user=user,
        resource_id=resource_id,
    )

    return result