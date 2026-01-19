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
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_task(self, doc_id: int):
    """
    Process a document through the full pipeline with granular status tracking.
    
    Pipeline stages:
    1. pending -> processing_ocr: Download from MinIO and extract text
    2. processing_ocr -> extracting_metadata: OCR complete, extracting metadata
    3. extracting_metadata -> summarizing: Metadata extracted, generating summary
    4. summarizing -> completed: All processing done
    5. Any stage -> failed: Error occurred (with retry logic)
    """
    db = SessionLocal()
    doc = None
    
    try:
        # === Stage 0: Verify document exists ===
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if not doc:
            logger.error("document_not_found", doc_id=doc_id)
            return {"status": "error", "message": "Document not found"}
        
        logger.info("processing_started", doc_id=doc_id, filename=doc.filename)
        
        # === Stage 1: OCR Processing ===
        doc.status = "processing_ocr"
        db.commit()
        logger.info("status_update", doc_id=doc_id, status="processing_ocr")
        
        # Download from MinIO
        try:
            response = s3_client.get_object(Bucket=BUCKET_NAME, Key=doc.s3_key)
            file_content = response['Body'].read()
            logger.info("file_downloaded", doc_id=doc_id, size_bytes=len(file_content))
        except Exception as e:
            logger.error("minio_download_failed", doc_id=doc_id, error=str(e))
            raise Exception(f"Failed to download file from storage: {str(e)}")
        
        # Extract text using OCR
        try:
            extracted_text = extract_text_from_bytes(file_content, doc.filename)
            doc.content = extracted_text
            db.commit()
            logger.info("ocr_complete", doc_id=doc_id, char_count=len(extracted_text))
        except Exception as e:
            logger.error("ocr_failed", doc_id=doc_id, error=str(e))
            raise Exception(f"OCR processing failed: {str(e)}")
        
        # === Stage 2: Metadata Extraction ===
        doc.status = "extracting_metadata"
        db.commit()
        logger.info("status_update", doc_id=doc_id, status="extracting_metadata")
        
        try:
            processor = DocumentProcessor(extracted_text)
            metadata = processor.extract_all()
            doc.metadata_results = metadata
            db.commit()
            logger.info("metadata_extracted", doc_id=doc_id, metadata_count=len(metadata))
        except Exception as e:
            logger.error("metadata_extraction_failed", doc_id=doc_id, error=str(e))
            # Non-critical: Continue to summary even if metadata fails
            doc.metadata_results = {"error": str(e)}
            db.commit()
            logger.warning("continuing_without_metadata", doc_id=doc_id)
        
        # === Stage 3: Summary Generation ===
        doc.status = "summarizing"
        db.commit()
        logger.info("status_update", doc_id=doc_id, status="summarizing")
        
        try:
            summary = LLMProcessor.get_summary(extracted_text)
            
            # Add summary to metadata
            if doc.metadata_results:
                doc.metadata_results["summary"] = summary
            else:
                doc.metadata_results = {"summary": summary}
            
            db.commit()
            logger.info("summary_generated", doc_id=doc_id, summary_length=len(summary))
        except Exception as e:
            logger.warning("summary_generation_failed", doc_id=doc_id, error=str(e))
            # Non-critical: Document can still be marked as completed
            if doc.metadata_results:
                doc.metadata_results["summary_error"] = str(e)
            else:
                doc.metadata_results = {"summary_error": str(e)}
            db.commit()
        
        # === Stage 4: Completion ===
        doc.status = "completed"
        db.commit()
        logger.info("processing_complete", doc_id=doc_id, final_status="completed")
        
        return {
            "status": "success",
            "doc_id": doc_id,
            "char_count": len(extracted_text),
            "metadata_keys": list(doc.metadata_results.keys()) if doc.metadata_results else []
        }
        
    except Exception as e:
        db.rollback()
        
        # Handle retries
        if self.request.retries < self.max_retries:
            retry_count = self.request.retries + 1
            logger.warning(
                "task_retrying",
                doc_id=doc_id,
                retry=retry_count,
                max_retries=self.max_retries,
                error=str(e)
            )
            
            # Update status to show it's being retried
            doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc:
                doc.status = f"retrying ({retry_count}/{self.max_retries})"
                db.commit()
            
            # Retry with exponential backoff
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        else:
            # Permanent failure after all retries exhausted
            logger.error(
                "processing_permanently_failed",
                doc_id=doc_id,
                error=str(e),
                retries_exhausted=True
            )
            
            doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc:
                doc.status = "failed"
                doc.metadata_results = {
                    "error": str(e),
                    "failed_at": doc.status,
                    "retries": self.max_retries
                }
                db.commit()
            
            return {
                "status": "failed",
                "doc_id": doc_id,
                "error": str(e)
            }
    finally:
        db.close()