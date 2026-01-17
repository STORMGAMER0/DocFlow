from sqlalchemy import ForeignKey, Boolean, Column, Integer, String, DateTime, Text, func
from sqlalchemy.orm import relationship
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
    owner_id = Column(Integer, ForeignKey("users.id"))


    owner = relationship("User", back_populates="documents")
     
    

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    documents = relationship("Document", back_populates="owner")