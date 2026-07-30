import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlmodel import Session

from auth import get_current_user
from db import get_session
from models import ProfileUpdateRequest, User, UserResponse

router = APIRouter(prefix="/api/profile", tags=["profile"])

_ALLOWED_RESUME_TYPES = (".pdf", ".docx")


def _extract_text_for_validation(filename: str, data: bytes) -> None:
    """Raise if the uploaded file isn't a parseable PDF/DOCX resume."""
    lower = filename.lower()
    try:
        if lower.endswith(".pdf"):
            from pdfminer.high_level import extract_text
            text = extract_text(io.BytesIO(data))
            if not text or not text.strip():
                raise ValueError("PDF appears to be empty or image-only")
        elif lower.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(data))
            if not any(p.text.strip() for p in doc.paragraphs):
                raise ValueError("DOCX appears to be empty")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse resume: {str(e)}")


@router.get("", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.model_dump())


@router.put("", response_model=UserResponse)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if request.name is not None:
        current_user.name = request.name
    if request.phone is not None:
        current_user.phone = request.phone
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return UserResponse(**current_user.model_dump())


@router.post("/resume", response_model=UserResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    filename = file.filename or ""
    if not filename.lower().endswith(_ALLOWED_RESUME_TYPES):
        raise HTTPException(status_code=422, detail="Resume must be a PDF or DOCX file")

    content = await file.read()
    _extract_text_for_validation(filename, content)

    current_user.resume_filename = filename
    current_user.resume_content = content
    current_user.resume_uploaded_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return UserResponse(**current_user.model_dump())


@router.get("/resume")
def download_resume(
    current_user: User = Depends(get_current_user),
):
    if not current_user.resume_content or not current_user.resume_filename:
        raise HTTPException(status_code=404, detail="No resume uploaded")

    media_type = "application/pdf" if current_user.resume_filename.lower().endswith(".pdf") \
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return Response(
        content=current_user.resume_content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{current_user.resume_filename}"'},
    )
