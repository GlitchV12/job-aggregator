import json
import io
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select, func
from models import (
    Job, JDAnalysis, AnalyzeJDRequest, JDAnalysisResponse, KeywordItem,
    ResumeScoreResponse, TranslateRequest, TranslateResponse,
    AIUsageLog, Subscription, User,
)
from db import get_session
from auth import get_current_user
from services.claude_service import analyze_jd, score_resume, translate_to_english

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

FREE_DAILY_LIMIT = 5


def _extract_pdf_text(data: bytes) -> str:
    from pdfminer.high_level import extract_text
    text = extract_text(io.BytesIO(data))
    if not text or not text.strip():
        raise ValueError("PDF appears to be empty or image-only (no extractable text)")
    return text


def _extract_docx_text(data: bytes) -> str:
    import docx
    doc = docx.Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def _check_and_log_ai_usage(user: User, session: Session) -> None:
    """
    Raise HTTP 429 if free user has hit today's limit.
    On success, record a new usage log entry.
    """
    # Get subscription
    sub = session.exec(select(Subscription).where(Subscription.user_id == user.id)).first()
    is_pro = (
        sub is not None
        and sub.plan == "pro"
        and sub.valid_until is not None
        and sub.valid_until > datetime.utcnow()
    )

    if not is_pro:
        # Count today's usages
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        uses_today = session.exec(
            select(func.count()).where(
                AIUsageLog.user_id == user.id,
                AIUsageLog.used_at >= today_start,
            )
        ).one()

        if uses_today >= FREE_DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="daily_limit_reached",
            )

    # Log this usage
    session.add(AIUsageLog(user_id=user.id))
    session.commit()


@router.post("/jd", response_model=JDAnalysisResponse)
async def analyze_job_description(
    request: AnalyzeJDRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Return cached analysis if available (doesn't count against limit)
    cached = session.get(JDAnalysis, request.job_id)
    if cached:
        return JDAnalysisResponse(
            job_id=cached.job_id,
            keywords=[KeywordItem(**k) for k in json.loads(cached.keywords)],
            resume_template=cached.resume_template,
        )

    job = session.get(Job, request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    _check_and_log_ai_usage(current_user, session)

    try:
        result = await analyze_jd(job.title, job.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    keywords = result.get("keywords", [])
    resume_template = result.get("resume_template", "")

    analysis = JDAnalysis(
        job_id=request.job_id,
        keywords=json.dumps(keywords),
        resume_template=resume_template,
    )
    session.add(analysis)
    session.commit()

    return JDAnalysisResponse(
        job_id=request.job_id,
        keywords=[KeywordItem(**k) for k in keywords],
        resume_template=resume_template,
    )


@router.post("/resume", response_model=ResumeScoreResponse)
async def score_resume_against_jd(
    job_id: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    content = await file.read()
    filename = (file.filename or "").lower()

    try:
        if filename.endswith(".pdf"):
            resume_text = _extract_pdf_text(content)
        elif filename.endswith(".docx"):
            resume_text = _extract_docx_text(content)
        else:
            resume_text = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse resume: {str(e)}")

    _check_and_log_ai_usage(current_user, session)

    try:
        result = await score_resume(job.title, job.description, resume_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI scoring failed: {str(e)}")

    return ResumeScoreResponse(
        score=result.get("score", 0),
        matched_keywords=result.get("matched_keywords", []),
        missing_keywords=result.get("missing_keywords", []),
        suggestions=result.get("suggestions", []),
    )


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    if not request.text.strip():
        raise HTTPException(status_code=422, detail="No text provided")
    try:
        translated = await translate_to_english(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
    return TranslateResponse(translated=translated)


@router.post("/resume-saved", response_model=ResumeScoreResponse)
async def score_saved_resume(
    job_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Score the user's stored profile resume against a job — no upload needed."""
    if not current_user.resume_content or not current_user.resume_filename:
        raise HTTPException(status_code=404, detail="No resume saved on your profile. Please upload one first.")

    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    filename = current_user.resume_filename.lower()
    try:
        if filename.endswith(".pdf"):
            resume_text = _extract_pdf_text(current_user.resume_content)
        elif filename.endswith(".docx"):
            resume_text = _extract_docx_text(current_user.resume_content)
        else:
            resume_text = current_user.resume_content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read your saved resume: {str(e)}")

    _check_and_log_ai_usage(current_user, session)

    try:
        result = await score_resume(job.title, job.description, resume_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI scoring failed: {str(e)}")

    return ResumeScoreResponse(
        score=result.get("score", 0),
        matched_keywords=result.get("matched_keywords", []),
        missing_keywords=result.get("missing_keywords", []),
        suggestions=result.get("suggestions", []),
    )
