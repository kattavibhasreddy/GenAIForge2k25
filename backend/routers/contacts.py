"""
Contacts router — /contacts/*
CRUD for project contacts (crew, talent, extras, clients, others).
"""
import logging
from fastapi import APIRouter, HTTPException, Request

from models.contact import ContactCreate, ContactUpdate
from services.db_service import (
    create_contact, get_contacts, update_contact, delete_contact
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contacts", tags=["Contacts"])


def _user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user.id


@router.get("/{project_id}")
async def list_contacts(project_id: str, request: Request):
    _user_id(request)
    try:
        contacts = get_contacts(project_id)
        return {"contacts": contacts}
    except Exception as exc:
        logger.error("List contacts error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not fetch contacts.")


@router.post("/{project_id}")
async def create_contact_route(project_id: str, request: Request, body: ContactCreate):
    _user_id(request)
    try:
        data = body.model_dump()
        contact = create_contact(project_id, data)
        return contact
    except Exception as exc:
        logger.error("Create contact error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not create contact.")


@router.put("/{project_id}/{contact_id}")
async def update_contact_route(project_id: str, contact_id: str, request: Request, body: ContactUpdate):
    _user_id(request)
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=422, detail="No fields provided.")
    try:
        contact = update_contact(contact_id, data)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")
        return contact
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Update contact error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not update contact.")


@router.delete("/{project_id}/{contact_id}")
async def delete_contact_route(project_id: str, contact_id: str, request: Request):
    _user_id(request)
    try:
        deleted = delete_contact(contact_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Contact not found.")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Delete contact error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not delete contact.")
