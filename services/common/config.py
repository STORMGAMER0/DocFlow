import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration using Pydantic for validation"""

    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/docprocessing"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket_name: str = "documents"

    # Elasticsearch
    elasticsearch_host: str = "elasticsearch:9200"

    # JWT
    jwt_secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()