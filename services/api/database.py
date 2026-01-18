from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This matches the credentials we put in docker-compose.yml
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@db:5432/docprocessing"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Helper to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()