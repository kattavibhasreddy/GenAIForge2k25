from routers.auth import router as auth_router
from routers.projects import router as projects_router
from routers.generation import router as generation_router
from routers.callsheet import router as callsheet_router
from routers.budget import router as budget_router
from routers.shot_design import router as shot_design_router
from routers.contacts import router as contacts_router

__all__ = [
    "auth_router", "projects_router", "generation_router",
    "callsheet_router", "budget_router", "shot_design_router",
    "contacts_router",
]
