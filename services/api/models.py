from sqlalchemy import Column, Integer, String, DateTime, Text, func
from datetime import datetime, timezone
from .database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    s3_key = Column(String)
    status = Column(String, default="pending")
    content = Column(Text, nullable=True)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    