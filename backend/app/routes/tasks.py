import logging

from fastapi import APIRouter, Depends

from app.schemas.tasks import (
    TaskCreate,
    TaskUpdate,
)
from app.services.task_service import (
    create_task,
    delete_task,
    get_task_count,
    get_tasks,
    update_task,
)
from app.utils.auth import get_current_user


logger = logging.getLogger(
    "codehub.tasks"
)


router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"]
)


@router.get("")
async def read_tasks(
    user=Depends(get_current_user)
):

    logger.info(
        "TASK_LIST user_id=%s",
        user.id
    )

    tasks = get_tasks(user.id)

    return {
        "tasks": tasks,
        "count": len(tasks),
    }


@router.get("/count")
async def read_task_count(
    user=Depends(get_current_user)
):

    logger.info(
        "TASK_COUNT user_id=%s",
        user.id
    )

    count = get_task_count(
        user.id
    )

    return {
        "count": count
    }


@router.post("")
async def create_new_task(
    task: TaskCreate,
    user=Depends(get_current_user)
):

    logger.info(
        "TASK_CREATE user_id=%s",
        user.id
    )

    created_task = create_task(
        user.id,
        task
    )

    return {
        "task": created_task
    }


@router.patch("/{task_id}")
async def update_existing_task(
    task_id: str,
    task: TaskUpdate,
    user=Depends(get_current_user)
):

    logger.info(
        "TASK_UPDATE user_id=%s task_id=%s",
        user.id,
        task_id
    )

    updated_task = update_task(
        user.id,
        task_id,
        task
    )

    return {
        "task": updated_task
    }


@router.delete("/{task_id}")
async def delete_existing_task(
    task_id: str,
    user=Depends(get_current_user)
):

    logger.info(
        "TASK_DELETE user_id=%s task_id=%s",
        user.id,
        task_id
    )

    return delete_task(
        user.id,
        task_id
    )