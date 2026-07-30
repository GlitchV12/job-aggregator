from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import ApplicationCreate, ApplicationResponse, ApplicationUpdate, User, UserJobApplication

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(UserJobApplication)
        .where(UserJobApplication.user_id == current_user.id)
        .order_by(UserJobApplication.applied_at.desc())
    ).all()
    return rows


@router.post("", response_model=ApplicationResponse)
def create_application(
    request: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    application = UserJobApplication(user_id=current_user.id, **request.model_dump())
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    request: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    application = session.get(UserJobApplication, application_id)
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    if request.status is not None:
        application.status = request.status
    if request.notes is not None:
        application.notes = request.notes
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    application = session.get(UserJobApplication, application_id)
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    session.delete(application)
    session.commit()
    return {"deleted": True}
