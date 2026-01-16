from fastapi import FastAPI, UploadFile, File, Depends
from sqlalchemy.orm import Session
from services.api import models
from services.api.database import get_db

from .storage import upload_to_minio
import uuid


app = FastAPI(title="DocFlow API")

@app.get("/")
def read_root():
    return {"status": "DocFlow API is Online", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"database": "connected", "storage": "online"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
        status = "pending"
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "document_id" : new_doc.id,
        "storage_path" : unique_filename,
        "message" : "file uploaded and queued for processing"
    }
