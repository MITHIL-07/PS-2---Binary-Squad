from fastapi import APIRouter

from app.services.h3_analysis import calculate_h3_readiness

router = APIRouter(prefix="/api", tags=["h3"])


@router.get("/h3")
def get_h3_readiness():
    cells = calculate_h3_readiness()

    features = []

    for cell in cells:
        coordinates = [
            [lng, lat]
            for lat, lng in cell["boundary"]
        ]

        coordinates.append(coordinates[0])

        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coordinates],
                },
                "properties": {
                    "h3": cell["h3"],
                    "readiness": cell["scores"]["readiness"],
                    "category": cell["category"],
                    "poi_count": cell["raw"]["poi_count"],
                    "commercial_pois": cell["raw"]["commercial_pois"],
                    "demand_activity_pois": cell["raw"]["demand_activity_pois"],
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "source": "OpenStreetMap",
        "region": "Ahmedabad, Gujarat, India",
        "resolution": 9,
        "features": features,
    }
