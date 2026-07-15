import json
import os
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from models import Company
from db import get_session

router = APIRouter(prefix="/api/companies", tags=["companies"])

_SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "companies.json")


@router.get("")
def list_companies(session: Session = Depends(get_session)):
    companies = session.exec(select(Company)).all()
    return companies


@router.post("/seed")
def seed_companies(session: Session = Depends(get_session)):
    """Load companies from companies.json into the DB (idempotent)."""
    with open(_SEED_PATH) as f:
        data = json.load(f)

    added = 0
    for item in data:
        existing = session.exec(
            select(Company).where(Company.name == item["name"])
        ).first()
        if not existing:
            session.add(Company(**item))
            added += 1

    session.commit()
    return {"seeded": added}
