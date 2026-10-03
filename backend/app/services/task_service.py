from datetime import datetime, timezone

from fastapi import HTTPException
from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)
from app.schemas.tasks import (
    TaskCreate,
    TaskUpdate,
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


def _get_user_tasks(user_id: str):

    response = (
        supabase
        .table("tasks")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def get_tasks(user_id: str):

    return _get_user_tasks(user_id)


def get_task_count(user_id: str):

    response = (
        supabase
        .table("tasks")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )

    tasks = response.data or []

    return len(tasks)


def create_task(
    user_id: str,
    task: TaskCreate
):

    data = {
        "user_id": user_id,
        "title": task.title,
        "description": task.description,
        "is_completed": False,
    }

    response = (
        supabase
        .table("tasks")
        .insert(data)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create task."
        )

    return response.data[0]


def update_task(
    user_id: str,
    task_id: str,
    task: TaskUpdate
):

    existing_response = (
        supabase
        .table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    existing_task = existing_response.data

    if not existing_task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    update_data = {}

    if task.title is not None:
        update_data["title"] = task.title

    if task.description is not None:
        update_data["description"] = (
            task.description
        )

    if task.is_completed is not None:

        update_data["is_completed"] = (
            task.is_completed
        )

        if task.is_completed:

            update_data["completed_at"] = (
                datetime.now(
                    timezone.utc
                ).isoformat()
            )

        else:

            update_data["completed_at"] = None

    if not update_data:

        return existing_task

    response = (
        supabase
        .table("tasks")
        .update(update_data)
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to update task."
        )

    return response.data[0]


def delete_task(
    user_id: str,
    task_id: str
):

    existing_response = (
        supabase
        .table("tasks")
        .select("id")
        .eq("id", task_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not existing_response.data:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    response = (
        supabase
        .table("tasks")
        .delete()
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )

    return {
        "message": "Task deleted successfully."
    }