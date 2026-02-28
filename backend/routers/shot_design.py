"""
Shot Design router — /shot-design/*
CRUD for 2D shot designs (canvas layouts with actors, cameras, lights, etc.)
"""
import logging
from fastapi import APIRouter, HTTPException, Request

from models.shot_design import ShotDesignCreate, ShotDesignUpdate
from services.db_service import (
    create_shot_design, get_shot_designs, get_shot_design,
    update_shot_design, delete_shot_design
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/shot-design", tags=["ShotDesign"])


def _user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user.id


@router.get("/{project_id}")
async def list_designs(project_id: str, request: Request):
    _user_id(request)
    try:
        designs = get_shot_designs(project_id)
        return {"designs": designs}
    except Exception as exc:
        logger.error("List shot designs error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not fetch shot designs.")


@router.get("/{project_id}/{design_id}")
async def get_design(project_id: str, design_id: str, request: Request):
    _user_id(request)
    try:
        design = get_shot_design(design_id)
        if not design:
            raise HTTPException(status_code=404, detail="Shot design not found.")
        return design
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Get shot design error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not fetch shot design.")


@router.post("/{project_id}")
async def create_design(project_id: str, request: Request, body: ShotDesignCreate):
    _user_id(request)
    try:
        data = body.model_dump()
        design = create_shot_design(project_id, data)
        return design
    except Exception as exc:
        logger.error("Create shot design error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not create shot design.")


@router.put("/{project_id}/{design_id}")
async def update_design(project_id: str, design_id: str, request: Request, body: ShotDesignUpdate):
    _user_id(request)
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=422, detail="No fields provided.")
    try:
        design = update_shot_design(design_id, data)
        if not design:
            raise HTTPException(status_code=404, detail="Shot design not found.")
        return design
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Update shot design error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not update shot design.")


@router.delete("/{project_id}/{design_id}")
async def delete_design_route(project_id: str, design_id: str, request: Request):
    _user_id(request)
    try:
        deleted = delete_shot_design(design_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Shot design not found.")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Delete shot design error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not delete shot design.")
