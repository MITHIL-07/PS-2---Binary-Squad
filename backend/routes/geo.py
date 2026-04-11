from fastapi import APIRouter, HTTPException, Query
from models.schemas import GeoDataRequest, GeoDataResponse, GeocodeRequest, GeocodeResponse
from services.geo_service import fetch_osm_layer, geocode_place
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/layers", response_model=GeoDataResponse)
async def get_geo_layer(request: GeoDataRequest):
    """
    Fetch OSM geospatial layer for a bounding box.
    Supported layers: roads, buildings, landuse, water, hospitals, schools
    """
    try:
        results = []
        for layer in request.layers:
            logger.info(f"Fetching OSM layer: {layer}")
            result = fetch_osm_layer(request.bbox.dict(), layer)
            results.append(result)

        # Return first layer result (extend for multi-layer if needed)
        primary = results[0] if results else {}
        return GeoDataResponse(
            success=primary.get("success", False),
            geojson=primary.get("geojson", {"type": "FeatureCollection", "features": []}),
            layer=primary.get("layer", ""),
            feature_count=primary.get("feature_count", 0),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Geo layer fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode(q: str = Query(..., description="Place name or address")):
    """
    Geocode a place name to lat/lng coordinates using Nominatim (OpenStreetMap).
    Example: /api/v1/geo/geocode?q=Ahmedabad, Gujarat
    """
    try:
        logger.info(f"Geocoding query: '{q}'")
        result = geocode_place(q)
        return GeocodeResponse(
            success=result["success"],
            query=q,
            latitude=result.get("latitude"),
            longitude=result.get("longitude"),
            display_name=result.get("display_name"),
        )
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported-layers")
async def supported_layers():
    """List all supported OSM layers."""
    return {
        "success": True,
        "layers": ["roads", "buildings", "landuse", "water", "hospitals", "schools"],
    }