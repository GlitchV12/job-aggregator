"""
Razorpay payment gateway integration.
Handles order creation and payment verification for Pro subscriptions.
"""
import hashlib
import hmac
import os
from datetime import datetime, timedelta

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func

from auth import get_current_user
from db import get_session
from models import (
    AIUsageLog, CreateOrderResponse, Subscription,
    SubscriptionStatusResponse, User, VerifyPaymentRequest,
)

router = APIRouter(prefix="/api/payments", tags=["payments"])

FREE_DAILY_LIMIT = 5

# Plan pricing in paise (1 INR = 100 paise)
PLAN_PRICES = {
    "monthly": 12900,   # ₹129
    "annual": 99900,    # ₹999
}
PLAN_DURATIONS = {
    "monthly": timedelta(days=31),
    "annual": timedelta(days=366),
}


def _get_razorpay_client():
    key_id = os.environ.get("RAZORPAY_KEY_ID", "")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway is not configured. Please contact support.",
        )
    return razorpay.Client(auth=(key_id, key_secret))


@router.get("/subscription", response_model=SubscriptionStatusResponse)
def get_subscription(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sub = session.exec(select(Subscription).where(Subscription.user_id == current_user.id)).first()
    is_pro = (
        sub is not None
        and sub.plan == "pro"
        and sub.valid_until is not None
        and sub.valid_until > datetime.utcnow()
    )

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    uses_today = session.exec(
        select(func.count()).where(
            AIUsageLog.user_id == current_user.id,
            AIUsageLog.used_at >= today_start,
        )
    ).one()

    return SubscriptionStatusResponse(
        plan="pro" if is_pro else "free",
        uses_today=uses_today,
        daily_limit=-1 if is_pro else FREE_DAILY_LIMIT,
        valid_until=sub.valid_until if sub else None,
    )


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    plan: str,
    current_user: User = Depends(get_current_user),
):
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan. Use 'monthly' or 'annual'.")

    client = _get_razorpay_client()
    amount = PLAN_PRICES[plan]

    order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "receipt": f"sub_{current_user.id}_{plan}",
        "notes": {
            "user_id": str(current_user.id),
            "plan": plan,
        },
    })

    return CreateOrderResponse(
        order_id=order["id"],
        amount=amount,
        currency="INR",
        key_id=os.environ.get("RAZORPAY_KEY_ID", ""),
    )


@router.post("/verify")
def verify_payment(
    request: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not key_secret:
        raise HTTPException(status_code=503, detail="Payment gateway not configured.")

    # Verify Razorpay signature
    msg = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(key_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed. Invalid signature.")

    if request.plan not in PLAN_DURATIONS:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    # Upsert subscription
    sub = session.exec(select(Subscription).where(Subscription.user_id == current_user.id)).first()
    valid_until = datetime.utcnow() + PLAN_DURATIONS[request.plan]

    if sub:
        # If already pro and not expired, extend from current valid_until
        if sub.plan == "pro" and sub.valid_until and sub.valid_until > datetime.utcnow():
            valid_until = sub.valid_until + PLAN_DURATIONS[request.plan]
        sub.plan = "pro"
        sub.valid_until = valid_until
        sub.razorpay_payment_id = request.razorpay_payment_id
    else:
        sub = Subscription(
            user_id=current_user.id,
            plan="pro",
            valid_until=valid_until,
            razorpay_payment_id=request.razorpay_payment_id,
        )
        session.add(sub)

    session.commit()
    return {"message": "Subscription activated", "valid_until": valid_until.isoformat(), "plan": "pro"}
