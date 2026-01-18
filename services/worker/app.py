import os
import fitz
import io
import pytesseract
from celery import Celery
from PIL import Image

# Infrastructure and Models
from services.api.storage import s3_client, BUCKET_NAME
from services.api.database import SessionLocal
from services.api import models
from services.api.logging_config import setup_logging, logger


setup_logging()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def process_document_task(self, doc_id: int):
    db = SessionLocal()
    doc = None
    try:
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        
        if not doc:
            # Metadata-rich error logging
            logger.error("document_not_found", doc_id=doc_id)
            return
        
        logger.info("processing_started", doc_id=doc_id, filename=doc.filename)

        # Download from MinIO
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=doc.s3_key)
        file_content = response['Body'].read()

        extracted_text = ""
        file_ext = doc.filename.split('.')[-1].lower()
        
        logger.info("storage_retrieval_success", 
                    doc_id=doc_id, 
                    bytes_received=len(file_content))

        if file_ext == 'pdf':
            logger.info("pdf_extraction_triggered", doc_id=doc_id)
            with fitz.open(stream=file_content, filetype="pdf") as pdf:
                for page in pdf:
                    extracted_text += page.get_text()
        
        else:
            logger.info("ocr_extraction_triggered", doc_id=doc_id, ext=file_ext)
            image = Image.open(io.BytesIO(file_content))
            extracted_text = pytesseract.image_to_string(image)

        # Update database with results
        doc.content = extracted_text
        doc.status = "completed"
        db.commit()

        logger.info("processing_complete", 
                    doc_id=doc_id, 
                    char_count=len(extracted_text),
                    preview=f"{extracted_text[:50]}...")

    except Exception as e:
        if self.request.retries < self.max_retries:
            logger.warning("task_retrying", doc_id = doc_id, retry = self.request.retries, error = str(e))
            raise self.retry(exc=e)
        else:
            logger.error("processing_permanently_failed", doc_id=doc_id, error=str(e))
            if doc:
                doc.status = "failed"
                db.commit()
    finally:
        db.close()


