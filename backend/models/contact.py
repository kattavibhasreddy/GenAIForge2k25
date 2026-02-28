from typing import Optional
from pydantic import BaseModel


class ContactCreate(BaseModel):
    title: str = ""
    name: str
    mobile: str = ""
    alternate_mobile: str = ""
    email: str = ""
    company: str = ""
    category: str = "Crew"        # Crew | Talent | Extras | Client | Others
    notes: str = ""
    picture_url: str = ""         # base64 or URL


class ContactUpdate(BaseModel):
    title: Optional[str] = None
    name: Optional[str] = None
    mobile: Optional[str] = None
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    picture_url: Optional[str] = None
