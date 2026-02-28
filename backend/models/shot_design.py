from typing import Optional, List
from pydantic import BaseModel


class ShotElement(BaseModel):
    """A single element on the 2D canvas (actor, camera, light, screen, prop)."""
    element_id: str          # unique id within the design
    element_type: str        # actor | camera | light | screen | prop
    label: str = ""
    x: float = 0
    y: float = 0
    rotation: float = 0      # degrees
    color: str = "#C07840"
    width: float = 40
    height: float = 40
    fov: float = 60           # field of view for cameras (degrees)
    cone_length: float = 120  # visual cone length for cameras/lights
    notes: str = ""


class ShotDesignCreate(BaseModel):
    scene_name: str = "Scene 1"
    shot_label: str = "Shot 1"
    canvas_width: float = 800
    canvas_height: float = 600
    elements: List[ShotElement] = []


class ShotDesignUpdate(BaseModel):
    scene_name: Optional[str] = None
    shot_label: Optional[str] = None
    canvas_width: Optional[float] = None
    canvas_height: Optional[float] = None
    elements: Optional[List[ShotElement]] = None
