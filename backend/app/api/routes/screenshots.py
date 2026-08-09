from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
import pytesseract


router = APIRouter(
    tags=["Screenshot Analysis"]
)


@router.post("/analyze-screenshot")
async def analyze_screenshot(
    file: UploadFile = File(...)
):
    """
    Upload an image/screenshot and extract readable text using OCR.
    """

    # =====================================================
    # 1. CHECK FILE
    # =====================================================

    if not file:
        raise HTTPException(
            status_code=400,
            detail="No screenshot file was uploaded."
        )

    # =====================================================
    # 2. CHECK FILE TYPE
    # =====================================================

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    content_type = (
        file.content_type or ""
    ).lower()

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are supported."
        )

    # =====================================================
    # 3. READ FILE
    # =====================================================

    try:
        contents = await file.read()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read uploaded image: {str(e)}"
        )

    # =====================================================
    # 4. CHECK FILE SIZE
    # =====================================================

    max_size = 10 * 1024 * 1024  # 10 MB

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 10 MB."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    # =====================================================
    # 5. OPEN IMAGE
    # =====================================================

    try:
        image = Image.open(
            io.BytesIO(contents)
        )

        image.load()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file."
        )

    # =====================================================
    # 6. OCR
    # =====================================================

    try:
        extracted_text = pytesseract.image_to_string(
            image
        )

        extracted_text = (
            extracted_text
            .replace("\x00", "")
            .strip()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR extraction failed: {str(e)}"
        )

    # =====================================================
    # 7. NO TEXT FOUND
    # =====================================================

    if not extracted_text:
        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": "",
            "message": (
                "No readable text was detected in "
                "the screenshot."
            ),
            "next_step": (
                "Try uploading a clearer screenshot "
                "with larger readable text."
            )
        }

    # =====================================================
    # 8. SUCCESS
    # =====================================================

    return {
        "success": True,
        "filename": file.filename,
        "extracted_text": extracted_text,
        "message": "Text successfully extracted from screenshot."
    }