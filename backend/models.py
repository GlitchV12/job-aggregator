from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field
import random
import re
import string


# ── Shared utility ────────────────────────────────────────────────────────────

_REMOTE_RE  = re.compile(r"\b(remote|fully[- ]remote|work[- ]from[- ]home|wfh|distributed|anywhere)\b", re.I)
_HYBRID_RE  = re.compile(r"\b(hybrid|flex|part[- ]remote|partially[- ]remote|mixed)\b", re.I)
_ONSITE_RE  = re.compile(r"\b(on[- ]?site|in[- ]office|in[- ]person|office[- ]based|in[- ]location)\b", re.I)


def detect_work_mode(title: str, description: str) -> Optional[str]:
    """Return 'remote', 'hybrid', 'onsite', or None."""
    text = (title + " " + description[:3000]).lower()
    if _REMOTE_RE.search(text):
        if _HYBRID_RE.search(text):
            return "hybrid"
        return "remote"
    if _HYBRID_RE.search(text):
        return "hybrid"
    if _ONSITE_RE.search(text):
        return "onsite"
    return None


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
    work_mode: Optional[str] = Field(default=None, index=True)  # remote | hybrid | onsite | None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class OTPRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_used: bool = Field(default=False)

    @staticmethod
    def generate_code() -> str:
        return "".join(random.choices(string.digits, k=6))


class JDAnalysis(SQLModel, table=True):
    job_id: str = Field(primary_key=True)
    keywords: str  # JSON string
    resume_template: str
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    name: Optional[str] = None
    phone: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_content: Optional[bytes] = None
    resume_uploaded_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserJobApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    job_id: Optional[str] = Field(default=None, index=True)
    job_title: str
    company_name: str
    apply_url: Optional[str] = None
    status: str = Field(default="applied")  # saved, applied, interviewing, offer, rejected
    notes: Optional[str] = None
    applied_at: datetime = Field(default_factory=datetime.utcnow)


class AIUsageLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    used_at: datetime = Field(default_factory=datetime.utcnow)


class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True, foreign_key="user.id")
    plan: str = Field(default="free")  # free | pro
    valid_until: Optional[datetime] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


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
    work_mode: Optional[str]
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


class TranslateRequest(SQLModel):
    text: str


class TranslateResponse(SQLModel):
    translated: str


class OTPRequest(SQLModel):
    email: str
    password: str
    name: Optional[str] = None


class OTPVerifyRequest(SQLModel):
    email: str
    otp: str
    password: str
    name: Optional[str] = None


class SignupRequest(SQLModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(SQLModel):
    email: str
    password: str


class UserResponse(SQLModel):
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str]
    resume_filename: Optional[str]
    resume_uploaded_at: Optional[datetime]
    created_at: datetime


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdateRequest(SQLModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class ApplicationCreate(SQLModel):
    job_id: Optional[str] = None
    job_title: str
    company_name: str
    apply_url: Optional[str] = None
    status: str = "applied"
    notes: Optional[str] = None


class ApplicationUpdate(SQLModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class ApplicationResponse(SQLModel):
    id: int
    job_id: Optional[str]
    job_title: str
    company_name: str
    apply_url: Optional[str]
    status: str
    notes: Optional[str]
    applied_at: datetime


class SubscriptionStatusResponse(SQLModel):
    plan: str           # free | pro
    uses_today: int
    daily_limit: int    # 5 for free, -1 (unlimited) for pro
    valid_until: Optional[datetime]


class CreateOrderResponse(SQLModel):
    order_id: str
    amount: int         # in paise
    currency: str
    key_id: str


class VerifyPaymentRequest(SQLModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str           # monthly | annual
