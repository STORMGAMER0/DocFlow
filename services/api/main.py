from typing import List
import uuid

from sqlalchemy.exc import IntegrityError
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from services.api import models, schemas, auth
from services.api.database import get_db
from services.api.logging_config import setup_logging, logger # Phase 1 Logging
from services.api.storage import s3_client, BUCKET_NAME

from .storage import upload_to_minio
from services.worker.app import process_document_task


setup_logging()

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try: 
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except auth.JWTError:
        raise HTTPException(status_code=401, detail="Invalid Token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

app = FastAPI(title="DocFlow API")

@app.get("/")
def read_root():
    logger.info("api_health_check", status="online", version="1.0")
    return {"status": "DocFlow API is Online", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"database": "connected", "storage": "online"}

@app.post("/register")
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.username == user_data.username
    ).first()
    
    if existing_user:
        logger.warning("registration_attempt_failed", reason="user_exists", username=user_data.username)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    try:
        hashed_pw = auth.hash_password(user_data.password)
        new_user = models.User(username=user_data.username, hashed_password=hashed_pw)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info("user_registered_successfully", username=new_user.username)
        return {
            "message": "User created successfully",
            "username": new_user.username
        }
    except Exception as e:
        db.rollback()
        logger.error("user_registration_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        logger.warning("login_failed", username=form_data.username)
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    logger.info("login_success", username=user.username)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"

    logger.info("upload_started", user_id=current_user.id, filename=file.filename)

    success = upload_to_minio(file.file, unique_filename)
    if not success:
        logger.error("minio_upload_failed", user_id=current_user.id, filename=file.filename)
        return {"error": "failed to save file to storage"}

    new_doc = models.Document(
        filename=file.filename,
        s3_key=unique_filename,
        status="pending",
        owner_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    process_document_task.delay(new_doc.id)
    logger.info("upload_queued", doc_id=new_doc.id, user_id=current_user.id)
 
    return {
        "document_id": new_doc.id,
        "storage_path": unique_filename,
        "message": "file uploaded and queued for processing"
    }

@app.get("/documents", response_model=List[schemas.DocumentResponse])
def list_documents(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id
    ).order_by(models.Document.upload_time.desc()).all()
    
    logger.info("documents_listed", user_id=current_user.id, count=len(documents))
    return documents

@app.get("/documents/search", response_model=List[schemas.DocumentResponse])
def search_documents(
    q: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    results = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id,
        (models.Document.content.ilike(f"%{q}%")) |
        (models.Document.filename.ilike(f"%{q}%"))
    ).all()
    
    logger.info("search_performed", user_id=current_user.id, query=q, results_found=len(results))
    return results

@app.get("/documents/{doc_id}")
def get_document_status(
    doc_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Search for the document in the database
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status, 
        "content": doc.content,
        "created_at": doc.upload_time
    }

@app.delete("/documents/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=doc.s3_key)
    except Exception as e:
        logger.error("minio_delete_failed", doc_id=doc_id, error=str(e))
        
    db.delete(doc)
    db.commit()
    
    logger.info("document_deleted", doc_id=doc_id, user_id=current_user.id)
    return None