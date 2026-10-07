import os
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile
from supabase import create_client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)

RESOURCE_BUCKET = "resources"

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# =========================================================
# VALID VALUES
# =========================================================

ALLOWED_CATEGORIES = {
    "aptitude",
    "core_cs",
    "coding",
}

ALLOWED_TOPICS = {
    "aptitude": {
        "formulas",
        "pdfs",
    },
    "core_cs": {
        "cn",
        "os",
        "dbms",
    },
    "coding": {
        "dsa",
    },
}

ALLOWED_TYPES = {
    "pdf",
    "document",
    "link",
    "youtube",
}


# =========================================================
# ADMIN CHECK
# =========================================================

def ensure_admin(user):
    """
    Verify that the authenticated user is an admin.
    """

    profile_response = (
        supabase.table("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .limit(1)
        .execute()
    )

    if (
        not profile_response
        or not profile_response.data
    ):
        raise HTTPException(
            status_code=403,
            detail="User profile not found.",
        )

    profile = profile_response.data[0]

    if not profile.get("is_active", True):
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive.",
        )

    if profile.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return profile


# =========================================================
# VALIDATION
# =========================================================

def validate_resource_data(
    category: str,
    topic: str,
    resource_type: str,
):
    category = category.strip().lower()
    topic = topic.strip().lower()
    resource_type = resource_type.strip().lower()

    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid category. Allowed values: "
                f"{', '.join(sorted(ALLOWED_CATEGORIES))}"
            ),
        )

    if topic not in ALLOWED_TOPICS[category]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid topic '{topic}' for "
                f"category '{category}'."
            ),
        )

    if resource_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid resource type. Allowed values: "
                f"{', '.join(sorted(ALLOWED_TYPES))}"
            ),
        )

    return category, topic, resource_type


# =========================================================
# GET RESOURCES
# =========================================================

def get_resources(
    category: Optional[str] = None,
    topic: Optional[str] = None,
):
    query = (
        supabase.table("resources")
        .select(
            "id,"
            "title,"
            "description,"
            "category,"
            "topic,"
            "type,"
            "url,"
            "file_path,"
            "created_by,"
            "created_at,"
            "updated_at,"
            "is_active"
        )
        .eq("is_active", True)
        .order(
            "created_at",
            desc=True,
        )
    )

    if category:
        query = query.eq(
            "category",
            category.strip().lower(),
        )

    if topic:
        query = query.eq(
            "topic",
            topic.strip().lower(),
        )

    response = query.execute()

    if not response:
        return []

    resources = response.data or []

    result = []

    for resource in resources:

        resource_url = resource.get("url")

        # -------------------------------------------------
        # FILE RESOURCE
        # -------------------------------------------------

        if resource.get("file_path"):

            try:
                signed_response = (
                    supabase.storage
                    .from_(RESOURCE_BUCKET)
                    .create_signed_url(
                        resource["file_path"],
                        3600,
                    )
                )

                if signed_response:
                    resource_url = (
                        signed_response.get(
                            "signedURL"
                        )
                        or signed_response.get(
                            "signedUrl"
                        )
                    )

            except Exception as error:
                print(
                    "Failed to create signed URL:",
                    error,
                )

                resource_url = None

        result.append(
            {
                **resource,
                "resource_url": resource_url,
            }
        )

    return result


# =========================================================
# CREATE RESOURCE
# =========================================================

async def create_resource(
    user,
    title: str,
    description: Optional[str],
    category: str,
    topic: str,
    resource_type: str,
    url: Optional[str],
    file: Optional[UploadFile],
):
    ensure_admin(user)

    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Resource title is required.",
        )

    (
        category,
        topic,
        resource_type,
    ) = validate_resource_data(
        category,
        topic,
        resource_type,
    )

    # =====================================================
    # LINK / YOUTUBE
    # =====================================================

    if resource_type in {"link", "youtube"}:

        if not url or not url.strip():
            raise HTTPException(
                status_code=400,
                detail="URL is required for this resource type.",
            )

        if file:
            raise HTTPException(
                status_code=400,
                detail="Do not upload a file for a link resource.",
            )

        data = {
            "title": title,
            "description": description.strip()
            if description
            else None,
            "category": category,
            "topic": topic,
            "type": resource_type,
            "url": url.strip(),
            "file_path": None,
            "created_by": user.id,
            "is_active": True,
        }

        response = (
            supabase.table("resources")
            .insert(data)
            .execute()
        )

        if (
            not response
            or not response.data
        ):
            raise HTTPException(
                status_code=500,
                detail="Failed to create resource.",
            )

        return response.data[0]

    # =====================================================
    # FILE RESOURCE
    # =====================================================

    if resource_type in {"pdf", "document"}:

        if not file:
            raise HTTPException(
                status_code=400,
                detail="File is required for this resource type.",
            )

        if url and url.strip():
            raise HTTPException(
                status_code=400,
                detail="Use either a file or a URL, not both.",
            )

        filename = file.filename or ""

        if not filename:
            raise HTTPException(
                status_code=400,
                detail="Invalid file.",
            )

        extension = ""

        if "." in filename:
            extension = (
                filename.rsplit(".", 1)[1]
                .lower()
            )

        if resource_type == "pdf":
            allowed_extensions = {
                "pdf",
            }

        else:
            allowed_extensions = {
                "pdf",
                "doc",
                "docx",
                "txt",
            }

        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file type. "
                    f"Allowed: "
                    f"{', '.join(sorted(allowed_extensions))}"
                ),
            )

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        # -------------------------------------------------
        # Generate safe storage path
        # -------------------------------------------------

        unique_id = uuid.uuid4().hex

        storage_path = (
            f"{category}/"
            f"{topic}/"
            f"{unique_id}_{filename}"
        )

        content_type = (
            file.content_type
            or "application/octet-stream"
        )

        # -------------------------------------------------
        # Upload to Supabase Storage
        # -------------------------------------------------

        try:

            supabase.storage \
                .from_(RESOURCE_BUCKET) \
                .upload(
                    storage_path,
                    file_bytes,
                    {
                        "content-type": content_type,
                        "upsert": "false",
                    },
                )

        except Exception as error:

            print(
                "Resource storage upload failed:",
                error,
            )

            raise HTTPException(
                status_code=500,
                detail="Failed to upload file to storage.",
            )

        # -------------------------------------------------
        # Store metadata in database
        # -------------------------------------------------

        data = {
            "title": title,
            "description": description.strip()
            if description
            else None,
            "category": category,
            "topic": topic,
            "type": resource_type,
            "url": None,
            "file_path": storage_path,
            "created_by": user.id,
            "is_active": True,
        }

        try:

            response = (
                supabase.table("resources")
                .insert(data)
                .execute()
            )

        except Exception as error:

            # ---------------------------------------------
            # Database failed after storage upload.
            # Remove orphaned file.
            # ---------------------------------------------

            try:
                (
                    supabase.storage
                    .from_(RESOURCE_BUCKET)
                    .remove([storage_path])
                )
            except Exception:
                pass

            print(
                "Resource database insert failed:",
                error,
            )

            raise HTTPException(
                status_code=500,
                detail="Failed to save resource information.",
            )

        if (
            not response
            or not response.data
        ):
            try:
                (
                    supabase.storage
                    .from_(RESOURCE_BUCKET)
                    .remove([storage_path])
                )
            except Exception:
                pass

            raise HTTPException(
                status_code=500,
                detail="Failed to save resource.",
            )

        return response.data[0]

    raise HTTPException(
        status_code=400,
        detail="Unsupported resource type.",
    )


# =========================================================
# DELETE RESOURCE
# =========================================================

def delete_resource(
    user,
    resource_id: str,
):
    ensure_admin(user)

    response = (
        supabase.table("resources")
        .select("id,file_path")
        .eq("id", resource_id)
        .limit(1)
        .execute()
    )

    if (
        not response
        or not response.data
    ):
        raise HTTPException(
            status_code=404,
            detail="Resource not found.",
        )

    resource = response.data[0]

    # -----------------------------------------------------
    # Remove file from Storage
    # -----------------------------------------------------

    if resource.get("file_path"):

        try:
            (
                supabase.storage
                .from_(RESOURCE_BUCKET)
                .remove([
                    resource["file_path"]
                ])
            )

        except Exception as error:
            print(
                "Failed to remove storage file:",
                error,
            )

    # -----------------------------------------------------
    # Soft delete database record
    # -----------------------------------------------------

    update_response = (
        supabase.table("resources")
        .update(
            {
                "is_active": False,
            }
        )
        .eq("id", resource_id)
        .execute()
    )

    if (
        not update_response
        or not update_response.data
    ):
        raise HTTPException(
            status_code=500,
            detail="Failed to delete resource.",
        )

    return {
        "message": "Resource deleted successfully."
    }