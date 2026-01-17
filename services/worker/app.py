import logging
import colorlog
from celery import Celery
import os
import io
import pytesseract

from PIL import Image
from services.api.storage import s3_client, BUCKET_NAME
from services.api.database import SessionLocal
from services.api import models

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

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("worker", broker = REDIS_URL, backend=REDIS_URL)

@celery_app.task
def process_document_task(doc_id: int):
    db = SessionLocal()
    try:
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if not doc:
            logger.error(f"Document{doc_id} not found in database!")
            return
        
        logger.info(f"Starting processing for Document ID: {doc_id}")
        #download the file from minIO
        response = s3_client.get_object(Bucket = BUCKET_NAME, Key = doc.s3_key)
        #"['Body'] lets you read the file's data from S3"
        file_content = response['Body'].read()
        logger.info(f"successfully retrieved {len(file_content)} bytes from storage")

        #converts bytes to an image
        image = Image.open(io.BytesIO(file_content))

        #perform OCR(Optical Character Resolution)
        logger.info(f"running OCR on {doc.filename}...")
        extracted_text = pytesseract.image_to_string(image)

        doc.content = extracted_text
        doc.status = "completed"
        db.commit()

        logger.info(f"AI extraction complete! found {len(extracted_text)}characters.")
        logger.info (f"preview: {extracted_text[:100]}...")

    except Exception as e:
        logger.exception(f"AI failed to process document {doc_id}")
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()



