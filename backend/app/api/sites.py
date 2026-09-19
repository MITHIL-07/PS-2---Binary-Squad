from fastapi import APIRouter

from app.services.features import build_osm_features

router = APIRouter(prefix="/api", tags=["sites"])


@router.get("/sites")
def get_sites():
    return {
        "source": "OpenStreetMap",
        "region": "Ahmedabad, Gujarat, India",
        "sites": build_osm_features(),
    }
