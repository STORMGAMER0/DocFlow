
from typing import List
import uuid
import logging
import colorlog

from sqlalchemy.exc import IntegrityError
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from services.api import models, schemas, auth
from services.api.database import get_db

from .storage import upload_to_minio
from services.worker.app import process_document_task

security = HTTPBearer()
handler = colorlog.StreamHandler()
handler.setFormatter(colorlog.ColoredFormatter(
    "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    log_colors={
        'DEBUG':    'cyan',
        'INFO':     'green',
        'WARNING':  'yellow',
        'ERROR':    'red',
        'CRITICAL': 'red,bg_white',
    }
))

logger = colorlog.getLogger(__name__)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):

    token = credentials.credentials
    try: 
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username : str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except auth.JWTError:
        raise HTTPException(status_code= 401, detail="Invalid Token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
    

app = FastAPI(title="DocFlow API")

@app.get("/")
def read_root():
    return {"status": "DocFlow API is Online", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"database": "connected", "storage": "online"}


@app.post("/register")
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with username and password.
    Password should be sent in request body, not query params.
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        models.User.username == user_data.username
    ).first()
    
    if existing_user:
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
        
        logger.info(f"New user registered: {user_data.username}")
        return {
            "message": "User created successfully",
            "username": new_user.username
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
@app.post("/upload")
async def upload_document(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    #generating a unique id for the file
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"

    #this streams the file to MinIO
    success = upload_to_minio(file.file, unique_filename)

    if not success:
        return{"error": "failed to save file to storage"}

    #create a record in postgres
    new_doc = models.Document(
        filename=file.filename,
        s3_key = unique_filename,
        status = "pending",
        owner_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    #trigger background worker
    process_document_task.delay(new_doc.id)
 
    return {
        "document_id" : new_doc.id,
        "storage_path" : unique_filename,
        "message" : "file uploaded and queued for processing"
    }


@app.get("/documents", response_model=List[schemas.DocumentResponse])
def list_documents(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(models.Document).filter(
        models.Document.user_id == current_user.id
    ).order_by(models.Document.upload_time.desc()).all()
    return documents




@app.get("/documents/search", response_model=List[schemas.DocumentResponse])
def search_documents(
    q: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    results = db.query(models.Document).filter(
        models.Document.user_id == current_user.id,
        (models.Document.content.ilike(f"%{q}%")) |
        (models.Document.filename.ilike(f"%{q}%"))
    ).all()
        
    return results