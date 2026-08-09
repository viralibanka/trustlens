from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io

router = APIRouter()


@router.post("/analyze-screenshot")
async def analyze_screenshot(file: UploadFile = File(...)):

    # Check file type
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

    # Read image
    contents = await file.read()

    # Limit file size to 10 MB
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 10 MB."
        )

    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    # ------------------------------------------------
    # Phase 1 MVP
    # ------------------------------------------------
    # Screenshot OCR will be connected next.
    # For now return a clear response so the frontend
    # upload flow can be tested safely.

    return {
        "success": True,
        "filename": file.filename,
        "message": "Screenshot uploaded successfully.",
        "next_step": "OCR analysis will extract text from this screenshot."
    }