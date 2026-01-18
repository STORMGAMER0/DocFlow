from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Dict, Optional

class DocumentResponse(BaseModel):
    id: int
    filename: str
    status: str
    content: Optional[str] = None
    metadata_results: Optional[Dict[str, Any]] = None
    upload_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=72)

class UserResponse(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True