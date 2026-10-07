from typing import Optional

from pydantic import BaseModel


class ResourceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    topic: str
    type: str
    url: Optional[str] = None
    file_path: Optional[str] = None
    resource_url: Optional[str] = None
    created_by: str
    created_at: str
    updated_at: str
    is_active: bool