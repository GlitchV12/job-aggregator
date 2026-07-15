from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Company(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    careers_url: str
    ats_platform: str  # greenhouse, lever, ashby, playwright, unknown
    ats_slug: Optional[str] = None
    logo_url: Optional[str] = None
    last_scraped: Optional[datetime] = None


class Job(SQLModel, table=True):
    id: str = Field(primary_key=True)  # {company_slug}_{job_id}
    company_name: str = Field(index=True)
    company_url: str
    company_logo: Optional[str] = None
    title: str = Field(index=True)
    job_id: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    description: str
    short_description: str
    apply_url: str
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class JDAnalysis(SQLModel, table=True):
    job_id: str = Field(primary_key=True)
    keywords: str  # JSON string
    resume_template: str
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


# Pydantic response models (not DB tables)
class JobResponse(SQLModel):
    id: str
    company_name: str
    company_url: str
    company_logo: Optional[str]
    title: str
    job_id: Optional[str]
    location: Optional[str]
    department: Optional[str]
    short_description: str
    apply_url: str
    scraped_at: datetime


class JobDetailResponse(JobResponse):
    description: str


class ScrapeRequest(SQLModel):
    url: str


class AnalyzeJDRequest(SQLModel):
    job_id: str


class KeywordItem(SQLModel):
    keyword: str
    weight: float
    category: str


class JDAnalysisResponse(SQLModel):
    job_id: str
    keywords: list[KeywordItem]
    resume_template: str


class ResumeScoreResponse(SQLModel):
    score: int
    matched_keywords: list[str]
    missing_keywords: list[str]
    suggestions: list[str]
