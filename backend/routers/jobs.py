from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_, func
from models import Job, JobResponse, JobDetailResponse
from db import get_session

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _build_base_query(search: str, company: str, location: str, date_from: Optional[str]):
    query = select(Job).where(Job.is_active == True)
    if search:
        query = query.where(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.company_name.ilike(f"%{search}%"),
                Job.short_description.ilike(f"%{search}%"),
            )
        )
    if company:
        query = query.where(Job.company_name.ilike(f"%{company}%"))
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from.replace("Z", "+00:00").replace("+00:00", ""))
            query = query.where(Job.scraped_at >= dt)
        except (ValueError, TypeError):
            pass
    return query


@router.get("/count")
def count_jobs(
    search: str = Query(default=""),
    company: str = Query(default=""),
    location: str = Query(default=""),
    date_from: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
):
    base = _build_base_query(search, company, location, date_from)
    count_query = select(func.count()).select_from(base.subquery())
    total = session.exec(count_query).one()
    return {"total": total}


@router.get("/locations")
def list_locations(session: Session = Depends(get_session)):
    rows = session.exec(
        select(Job.location)
        .where(Job.is_active == True)
        .where(Job.location != None)
        .where(Job.location != "")
        .distinct()
    ).all()
    locations = sorted({r.strip() for r in rows if r and r.strip()})
    return locations


@router.get("", response_model=list[JobResponse])
def list_jobs(
    search: str = Query(default=""),
    company: str = Query(default=""),
    location: str = Query(default=""),
    date_from: Optional[str] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, le=100),
    session: Session = Depends(get_session),
):
    query = _build_base_query(search, company, location, date_from)
    query = query.order_by(Job.scraped_at.desc()).offset(skip).limit(limit)
    return session.exec(query).all()


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(job_id: str, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
