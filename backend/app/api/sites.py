from fastapi import APIRouter

from app.services.features import build_osm_features
from app.services.scoring import SiteFactors
from app.services.recommendation import build_recommendation

router = APIRouter(prefix="/api", tags=["sites"])


# Candidate-site baseline factors.
# OSM-derived accessibility and competitive opportunity
# are merged into these values by the analysis endpoint.
CANDIDATE_SITES = {
    "SG Highway": {
        "id": "A",
        "name": "SG Highway A",
        "lat": 23.0339,
        "lng": 72.5067,
        "population": 92,
        "land_use": 91,
        "risk": 89,
    },
    "Prahlad Nagar": {
        "id": "B",
        "name": "Prahlad Nagar B",
        "lat": 23.0122,
        "lng": 72.5104,
        "population": 88,
        "land_use": 84,
        "risk": 91,
    },
    "Bopal": {
        "id": "C",
        "name": "Bopal C",
        "lat": 23.0302,
        "lng": 72.4657,
        "population": 82,
        "land_use": 81,
        "risk": 90,
    },
    "Naroda": {
        "id": "D",
        "name": "Naroda D",
        "lat": 23.0702,
        "lng": 72.6580,
        "population": 76,
        "land_use": 74,
        "risk": 82,
    },
}


@router.get("/sites")
def get_sites():
    return {
        "source": "OpenStreetMap",
        "region": "Ahmedabad, Gujarat, India",
        "sites": build_osm_features(),
    }


@router.get("/sites/analysis")
def analyze_sites():
    osm_sites = build_osm_features()
    analyses = []

    for site_name, candidate in CANDIDATE_SITES.items():
        osm = osm_sites[site_name]

        scores = osm["scores"]

        factors = SiteFactors(
            population=candidate["population"],
            accessibility=scores["accessibility"],
            competition=100 - scores["competitive_opportunity"],
            land_use=candidate["land_use"],
            risk=candidate["risk"],
        )

        recommendation = build_recommendation(factors)

        analyses.append({
            "id": candidate["id"],
            "name": candidate["name"],
            "lat": candidate["lat"],
            "lng": candidate["lng"],
            "score": recommendation["score"],
            "category": recommendation["category"],
            "summary": recommendation["summary"],
            "strengths": recommendation["strengths"],
            "considerations": recommendation["considerations"],
            "breakdown": recommendation["breakdown"],
            "osm": {
                "accessibility": scores["accessibility"],
                "competitive_opportunity": scores[
                    "competitive_opportunity"
                ],
                "activity_demand_proxy": scores[
                    "activity_demand_proxy"
                ],
            },
        })

    return {
        "source": "OpenStreetMap + GeoReadiness scoring engine",
        "region": "Ahmedabad, Gujarat, India",
        "sites": analyses,
    }
