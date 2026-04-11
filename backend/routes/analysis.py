from fastapi import APIRouter, HTTPException
from models.schemas import SiteAnalysisRequest, SiteAnalysisResponse
from services.scoring_service import run_site_analysis
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/site-detection", response_model=SiteAnalysisResponse)
async def detect_sites(request: SiteAnalysisRequest):
    """
    Core site detection endpoint.
    Accepts a bounding box + use case, returns top N ranked GeoJSON sites.

    Example use cases: solar_farm, retail_store, warehouse, hospital, school
    """
    try:
        logger.info(f"Site analysis | use_case={request.use_case} | top_n={request.top_n}")

        bbox = request.bbox.dict()
        result = await run_site_analysis(
            bbox=bbox,
            use_case=request.use_case,
            custom_weights=request.criteria,
            top_n=request.top_n or 5,
        )

        return SiteAnalysisResponse(
            success=result["success"],
            use_case=result["use_case"],
            total_candidates=result["total_candidates"],
            top_sites=result["top_sites"],
            bbox=request.bbox,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Site analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/use-cases")
async def list_use_cases():
    """Return all supported use cases and their default scoring weights."""
    from services.scoring_service import USE_CASE_WEIGHTS
    return {
        "success": True,
        "use_cases": list(USE_CASE_WEIGHTS.keys()),
        "weights": USE_CASE_WEIGHTS,
    }