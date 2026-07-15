import json
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session
from models import Job, JDAnalysis, AnalyzeJDRequest, JDAnalysisResponse, KeywordItem, ResumeScoreResponse
from db import get_session
from services.claude_service import analyze_jd, score_resume

router = APIRouter(prefix="/api/analyze", tags=["analyze"])


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


@router.post("/jd", response_model=JDAnalysisResponse)
async def analyze_job_description(
    request: AnalyzeJDRequest,
    session: Session = Depends(get_session),
):
    # Return cached analysis if available
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
