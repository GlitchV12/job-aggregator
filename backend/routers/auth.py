import os
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import create_access_token, get_current_user, hash_password, verify_password
from db import get_session
from models import (
    LoginRequest,
    OTPRecord,
    OTPRequest,
    OTPVerifyRequest,
    SignupRequest,
    TokenResponse,
    User,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_EXPIRY_MINUTES = 10


def _send_otp_email(to_email: str, otp_code: str) -> None:
    """Send a 6-digit OTP via Gmail SMTP. Requires SMTP_USER + SMTP_PASS env vars."""
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        # In dev without SMTP configured, just print to console
        print(f"[OTP] Dev mode — OTP for {to_email}: {otp_code}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp_code} is your Job Aggregator verification code"
    msg["From"] = smtp_user
    msg["To"] = to_email

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px 24px;
                background:#f8f9ff;border-radius:16px;">
      <h2 style="color:#4f46e5;margin:0 0 8px">Verify your email</h2>
      <p style="color:#374151;margin:0 0 24px">Enter this code to complete your signup:</p>
      <div style="background:#fff;border:2px solid #e0e7ff;border-radius:12px;
                  padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#4f46e5">
          {otp_code}
        </span>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0">
        This code expires in {OTP_EXPIRY_MINUTES} minutes.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())


# ── New 2-step signup ──────────────────────────────────────────────────────────

@router.post("/send-otp")
def send_otp(request: OTPRequest, session: Session = Depends(get_session)):
    email = request.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Invalid email")
    if len(request.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # Invalidate any previous unused OTPs for this email
    old_otps = session.exec(
        select(OTPRecord).where(OTPRecord.email == email, OTPRecord.is_used == False)
    ).all()
    for old in old_otps:
        old.is_used = True
        session.add(old)

    otp_code = OTPRecord.generate_code()
    record = OTPRecord(email=email, otp_code=otp_code)
    session.add(record)
    session.commit()

    try:
        _send_otp_email(email, otp_code)
    except Exception as e:
        print(f"[OTP] Email send failed: {e}")
        # Don't fail the request — the OTP is stored; user can resend

    return {"message": "OTP sent to your email"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(request: OTPVerifyRequest, session: Session = Depends(get_session)):
    email = request.email.strip().lower()

    record = session.exec(
        select(OTPRecord)
        .where(OTPRecord.email == email, OTPRecord.is_used == False)
        .order_by(OTPRecord.created_at.desc())
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    age = datetime.utcnow() - record.created_at
    if age > timedelta(minutes=OTP_EXPIRY_MINUTES):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if record.otp_code != request.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    # Mark OTP as used
    record.is_used = True
    session.add(record)

    # Check again if user was created between send and verify
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(email=email, password_hash=hash_password(request.password), name=request.name)
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse(**user.model_dump()))


# ── Legacy direct signup (kept for compatibility) ─────────────────────────────

@router.post("/signup", response_model=TokenResponse)
def signup(request: SignupRequest, session: Session = Depends(get_session)):
    email = request.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Invalid email")
    if len(request.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(email=email, password_hash=hash_password(request.password), name=request.name)
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse(**user.model_dump()))


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    email = request.email.strip().lower()
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse(**user.model_dump()))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.model_dump())
