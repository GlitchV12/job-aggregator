import json
import os
from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

load_dotenv()

from db import create_db_and_tables, engine
from models import Company, Job
from routers import jobs, companies, scrape, analyze
from services.scrape_service import scrape_company

scheduler = AsyncIOScheduler()


async def refresh_all_companies():
    """Background task: re-scrape all curated companies and upsert jobs."""
    with Session(engine) as session:
        all_companies = session.exec(select(Company)).all()

    for company in all_companies:
        try:
            raw_jobs = await scrape_company(
                {
                    "ats_platform": company.ats_platform,
                    "ats_slug": company.ats_slug,
                    "careers_url": company.careers_url,
                    "name": company.name,
                }
            )
            with Session(engine) as session:
                for raw in raw_jobs:
                    existing = session.get(Job, raw["id"])
                    if existing:
                        for k, v in raw.items():
                            setattr(existing, k, v)
                        session.add(existing)
                    else:
                        session.add(Job(**raw))
                company_db = session.get(Company, company.id)
                if company_db:
                    company_db.last_scraped = datetime.utcnow()
                    session.add(company_db)
                session.commit()
        except Exception as e:
            print(f"[scraper] Failed for {company.name}: {e}")


async def seed_companies_on_startup():
    seed_path = os.path.join(os.path.dirname(__file__), "companies.json")
    if not os.path.exists(seed_path):
        return
    with open(seed_path) as f:
        data = json.load(f)
    with Session(engine) as session:
        for item in data:
            existing = session.exec(select(Company).where(Company.name == item["name"])).first()
            if not existing:
                session.add(Company(**item))
        session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    await seed_companies_on_startup()
    scheduler.add_job(refresh_all_companies, "interval", hours=6, id="refresh_jobs")
    scheduler.start()
    # Run initial scrape in background (non-blocking)
    import asyncio
    asyncio.create_task(refresh_all_companies())
    yield
    scheduler.shutdown()


app = FastAPI(title="Job Aggregator API", lifespan=lifespan)

# Comma-separated list of allowed origins from env, e.g.:
# ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5174,http://localhost:5173,http://localhost:3000",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(companies.router)
app.include_router(scrape.router)
app.include_router(analyze.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
