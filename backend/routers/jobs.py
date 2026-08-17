from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_, func
from sqlalchemy import text
from models import Job, JobResponse, JobDetailResponse, detect_work_mode
from db import get_session, is_postgres
from search_synonyms import expand_terms

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _apply_search(query, search: str):
    terms = expand_terms(search)
    if not terms:
        return query

    if is_postgres():
        tsquery = " OR ".join(f"({t})" for t in terms)
        return query.where(
            text("job.search_vector @@ websearch_to_tsquery('english', :tsquery)").bindparams(tsquery=tsquery)
        )

    clauses = []
    for term in terms:
        clauses.extend([
            Job.title.ilike(f"%{term}%"),
            Job.company_name.ilike(f"%{term}%"),
            Job.description.ilike(f"%{term}%"),
        ])
    return query.where(or_(*clauses))


def _rank_order_clause(search: str):
    if not search or not is_postgres():
        return None
    tsquery = " OR ".join(f"({t})" for t in expand_terms(search))
    return text("ts_rank(job.search_vector, websearch_to_tsquery('english', :tsquery)) DESC").bindparams(tsquery=tsquery)


def _build_base_query(search: str, company: str, location: str, date_from: Optional[str], work_mode: str):
    query = select(Job).where(Job.is_active == True)
    if search:
        query = _apply_search(query, search)
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
    if work_mode:
        # Filter by stored work_mode, but also do a text-based fallback for legacy rows
        if work_mode == "remote":
            query = query.where(
                (Job.work_mode == "remote") |
                (Job.work_mode == None) & Job.description.ilike("%remote%")
            )
        elif work_mode == "hybrid":
            query = query.where(
                (Job.work_mode == "hybrid") |
                (Job.work_mode == None) & Job.description.ilike("%hybrid%")
            )
        elif work_mode == "onsite":
            query = query.where(Job.work_mode == "onsite")
    return query


@router.get("/count")
def count_jobs(
    search: str = Query(default=""),
    company: str = Query(default=""),
    location: str = Query(default=""),
    date_from: Optional[str] = Query(default=None),
    work_mode: str = Query(default=""),
    session: Session = Depends(get_session),
):
    base = _build_base_query(search, company, location, date_from, work_mode)
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
    work_mode: str = Query(default=""),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, le=100),
    session: Session = Depends(get_session),
):
    query = _build_base_query(search, company, location, date_from, work_mode)
    rank_clause = _rank_order_clause(search)
    if rank_clause is not None:
        query = query.order_by(rank_clause, Job.scraped_at.desc())
    else:
        query = query.order_by(Job.scraped_at.desc())
    query = query.offset(skip).limit(limit)

    jobs = session.exec(query).all()
    # Back-fill work_mode for legacy rows that don't have it yet
    for job in jobs:
        if job.work_mode is None:
            job.work_mode = detect_work_mode(job.title, job.description)
    return jobs


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(job_id: str, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.work_mode is None:
        job.work_mode = detect_work_mode(job.title, job.description)
    return job
