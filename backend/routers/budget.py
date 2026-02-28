"""
Budget router — /budget/*
Routes:
  GET    /budget/{project_id}       — list all budget items for a project
  POST   /budget/{project_id}       — create a budget item
  PUT    /budget/item/{item_id}     — update a budget item
  DELETE /budget/item/{item_id}     — delete a budget item
"""
import logging
from fastapi import APIRouter, HTTPException, Request

from models.budget import BudgetItemCreate, BudgetItemUpdate
from services.db_service import (
    create_budget_item, get_budget, update_budget_item, delete_budget_item
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/budget", tags=["Budget"])


def _user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user.id


@router.get("/{project_id}")
async def get_budget_route(project_id: str, request: Request):
    """List all budget items for a project."""
    _user_id(request)
    try:
        items = get_budget(project_id)
        return {"items": items}
    except Exception as exc:
        logger.error("Get budget error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not fetch budget.")


@router.post("/{project_id}")
async def create_budget_item_route(project_id: str, request: Request, body: BudgetItemCreate):
    """Create a new budget item."""
    _user_id(request)
    try:
        data = body.model_dump()
        item = create_budget_item(project_id, data)
        return item
    except Exception as exc:
        logger.error("Create budget item error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not create budget item.")


@router.put("/item/{item_id}")
async def update_budget_item_route(item_id: str, request: Request, body: BudgetItemUpdate):
    """Update a budget item."""
    _user_id(request)
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=422, detail="No fields provided for update.")
    try:
        item = update_budget_item(item_id, data)
        if not item:
            raise HTTPException(status_code=404, detail="Budget item not found.")
        return item
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Update budget item error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not update budget item.")


@router.delete("/item/{item_id}")
async def delete_budget_item_route(item_id: str, request: Request):
    """Delete a budget item."""
    _user_id(request)
    try:
        deleted = delete_budget_item(item_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Budget item not found.")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Delete budget item error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not delete budget item.")
