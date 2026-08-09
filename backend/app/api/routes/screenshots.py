from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
import pytesseract

router = APIRouter()


@router.post("/analyze-screenshot")
async def analyze_screenshot(file: UploadFile = File(...)):

    # ------------------------------------------------
    # Check file type
    # ------------------------------------------------

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are supported."
        )

    # ------------------------------------------------
    # Read image
    # ------------------------------------------------

    contents = await file.read()

    # ------------------------------------------------
    # File size limit
    # ------------------------------------------------

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 10 MB."
        )

    # ------------------------------------------------
    # Open image
    # ------------------------------------------------

    try:
        image = Image.open(io.BytesIO(contents))
        image.load()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    # ------------------------------------------------
    # OCR EXTRACTION
    # ------------------------------------------------

    try:

        extracted_text = pytesseract.image_to_string(image)

        extracted_text = extracted_text.strip()

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"OCR extraction failed: {str(e)}"
        )

    # ------------------------------------------------
    # No text detected
    # ------------------------------------------------

    if not extracted_text:

        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": "",
            "message": "No readable text was detected in the screenshot.",
            "next_step": "Try uploading a clearer screenshot."
        }

    # ------------------------------------------------
    # OCR successful
    # ------------------------------------------------

    return {
        "success": True,
        "filename": file.filename,
        "extracted_text": extracted_text,
        "message": "Text successfully extracted from screenshot."
    }