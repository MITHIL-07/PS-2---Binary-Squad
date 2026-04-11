from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    reply: str
    session_id: Optional[str] = None
    tool_used: Optional[str] = None


class BoundingBox(BaseModel):
    min_lat: float
    min_lng: float
    max_lat: float
    max_lng: float

class GeoDataRequest(BaseModel):
    bbox: BoundingBox
    layers: Optional[List[str]] = ["roads", "buildings", "landuse"]

class GeoDataResponse(BaseModel):
    success: bool
    geojson: Dict[str, Any]
    layer: str
    feature_count: int


class SiteAnalysisRequest(BaseModel):
    bbox: BoundingBox
    use_case: str
    criteria: Optional[Dict[str, float]] = None
    top_n: Optional[int] = 5

class ScoredSite(BaseModel):
    site_id: str
    latitude: float
    longitude: float
    score: float
    breakdown: Dict[str, float]
    geojson: Optional[Dict[str, Any]] = None

class SiteAnalysisResponse(BaseModel):
    success: bool
    use_case: str
    total_candidates: int
    top_sites: List[ScoredSite]
    bbox: BoundingBox


class GeocodeRequest(BaseModel):
    query: str

class GeocodeResponse(BaseModel):
    success: bool
    query: str
    latitude: Optional[float]
    longitude: Optional[float]
    display_name: Optional[str]