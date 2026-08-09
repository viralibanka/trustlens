from fastapi import APIRouter, UploadFile, File, HTTPException
import io
import fitz  # PyMuPDF

router = APIRouter()


@router.post("/analyze-document")
async def analyze_document(file: UploadFile = File(...)):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    contents = await file.read()

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="PDF size must be less than 10 MB."
        )

    try:
        pdf = fitz.open(stream=contents, filetype="pdf")

        extracted_text = ""

        for page in pdf:
            extracted_text += page.get_text()

        pdf.close()

        extracted_text = extracted_text.strip()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF extraction failed: {str(e)}"
        )

    if not extracted_text:
        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": "",
            "message": "No readable text found in PDF."
        }

    return {
        "success": True,
        "filename": file.filename,
        "extracted_text": extracted_text,
        "message": "PDF text successfully extracted."
    }