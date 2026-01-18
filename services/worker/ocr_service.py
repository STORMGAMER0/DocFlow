import io
import fitz
import pytesseract
from PIL import Image
from services.api.logging_config import logger

def extract_text_from_bytes(file_content: bytes, filename: str) -> str:
    extracted_text = ""
    file_ext = filename.split('.')[-1].lower()

    try:
        if file_ext == 'pdf':
            logger.info("pdf_extraction_triggered", filename=filename)
            with fitz.open(stream=file_content, filetype="pdf") as pdf:
                for page in pdf:
                    extracted_text += page.get_text()
            
            # Fallback for scanned PDFs
            if not extracted_text.strip():
                logger.info("pdf_is_scanned_falling_back_to_ocr", filename=filename)
                with fitz.open(stream=file_content, filetype="pdf") as pdf:
                    for page in pdf:
                        pix = page.get_pixmap()
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        extracted_text += pytesseract.image_to_string(img)
        
        else:
            logger.info("ocr_extraction_triggered", filename=filename, ext=file_ext)
            image = Image.open(io.BytesIO(file_content))
            extracted_text = pytesseract.image_to_string(image)

        return extracted_text.strip()

    except Exception as e:
        logger.error("extraction_logic_failed", filename=filename, error=str(e))
        raise e