from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from models import Job, ScrapeRequest, JobResponse
from db import get_session
from services.scrape_service import scrape_url

router = APIRouter(prefix="/api/scrape", tags=["scrape"])


@router.post("", response_model=list[JobResponse])
async def scrape_on_demand(request: ScrapeRequest, session: Session = Depends(get_session)):
    """Scrape jobs from any URL on demand. Returns the scraped jobs and upserts into DB."""
    try:
        raw_jobs = await scrape_url(request.url)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Scraping failed: {str(e)}")

    if not raw_jobs:
        raise HTTPException(status_code=404, detail="No jobs found at the provided URL")

    results = []
    for raw in raw_jobs:
        existing = session.get(Job, raw["id"])
        if existing:
            for key, val in raw.items():
                setattr(existing, key, val)
            session.add(existing)
        else:
            job = Job(**raw)
            session.add(job)
        results.append(raw)

    session.commit()
    return results
