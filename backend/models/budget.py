from typing import Optional, List
from pydantic import BaseModel


class BudgetItemCreate(BaseModel):
    category_id: str
    category_name: str
    item_id: str
    item_name: str
    qty: float = 0
    units: float = 0
    rate: float = 0
    fringes: float = 0
    estimated: float = 0
    actual: float = 0
    paid: float = 0


class BudgetItemUpdate(BaseModel):
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    qty: Optional[float] = None
    units: Optional[float] = None
    rate: Optional[float] = None
    fringes: Optional[float] = None
    estimated: Optional[float] = None
    actual: Optional[float] = None
    paid: Optional[float] = None
