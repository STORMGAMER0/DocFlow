import os
import fitz
import io
import pytesseract
from celery import Celery
from PIL import Image

from services.worker.llm_service import LLMProcessor
from services.worker.processor_service import DocumentProcessor

# Infrastructure and Models
from .ocr_service import extract_text_from_bytes
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
            logger.error("document_not_found", doc_id=doc_id)
            return
        
        logger.info("processing_started", doc_id=doc_id)

        # 1. Download from MinIO
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=doc.s3_key)
        file_content = response['Body'].read()

        # 2. Extract Text using the new service
        extracted_text = extract_text_from_bytes(file_content, doc.filename)

        processor = DocumentProcessor(extracted_text)
        metadata = processor.extract_all()

        metadata["summary"] = LLMProcessor.get_summary(extracted_text)
        
        doc.content = extracted_text
        doc.metadata_results = metadata
        doc.status = "completed"
        db.commit()

                # Then try to add summary (but don't fail if it times out)
        try:
            summary = LLMProcessor.get_summary(extracted_text)
            doc.metadata_results["summary"] = summary
            db.commit()
            logger.info("summary_generated", doc_id=doc_id)
        except Exception as e:
            logger.warning("summary_generation_failed", doc_id=doc_id, error=str(e))
            # Document is still marked as completed

        logger.info("processing_complete", doc_id=doc_id, char_count=len(extracted_text))

    except Exception as e:
        db.rollback()
        if self.request.retries < self.max_retries:
            logger.warning("task_retrying", doc_id=doc_id, retry=self.request.retries, error=str(e))
            raise self.retry(exc=e)
        else:
            logger.error("processing_permanently_failed", doc_id=doc_id, error=str(e))
            doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc:
                doc.status = "failed"
                db.commit()
    finally:
        db.close()
