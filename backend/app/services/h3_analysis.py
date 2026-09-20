import json
from pathlib import Path

import h3


BASE_DIR = Path(__file__).resolve().parents[2]

ROADS_FILE = BASE_DIR / "data" / "osm" / "roads.json"
POIS_FILE = BASE_DIR / "data" / "osm" / "pois.json"

H3_RESOLUTION = 9

AHMEDABAD_BBOX = {
    "min_lat": 22.95,
    "max_lat": 23.15,
    "min_lng": 72.40,
    "max_lng": 72.70,
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def point_in_bbox(lat, lng):
    return (
        AHMEDABAD_BBOX["min_lat"] <= lat <= AHMEDABAD_BBOX["max_lat"]
        and AHMEDABAD_BBOX["min_lng"] <= lng <= AHMEDABAD_BBOX["max_lng"]
    )


def get_poi_point(element):
    if element.get("type") == "node":
        lat = element.get("lat")
        lng = element.get("lon")

        if lat is not None and lng is not None:
            return lat, lng

    center = element.get("center")

    if center:
        lat = center.get("lat")
        lng = center.get("lon")

        if lat is not None and lng is not None:
            return lat, lng

    return None


def build_h3_grid():
    pois = load_json(POIS_FILE)

    cells = {}

    for element in pois.get("elements", []):
        point = get_poi_point(element)

        if point is None:
            continue

        lat, lng = point

        if not (
            AHMEDABAD_BBOX["min_lat"] <= lat <= AHMEDABAD_BBOX["max_lat"]
            and AHMEDABAD_BBOX["min_lng"] <= lng <= AHMEDABAD_BBOX["max_lng"]
        ):
            continue

        cell = h3.latlng_to_cell(
            lat,
            lng,
            H3_RESOLUTION,
        )

        if cell not in cells:
            cells[cell] = {
                "h3": cell,
                "poi_count": 0,
                "commercial_pois": 0,
                "demand_activity_pois": 0,
                "lat": lat,
                "lng": lng,
            }

        cells[cell]["poi_count"] += 1

        tags = element.get("tags", {})

        amenity = tags.get("amenity", "")
        shop = tags.get("shop", "")
        office = tags.get("office", "")

        commercial_shops = {
            "supermarket",
            "convenience",
            "department_store",
            "mall",
            "bakery",
            "clothes",
            "electronics",
            "furniture",
            "hardware",
            "mobile_phone",
            "car",
            "car_repair",
            "beauty",
            "books",
            "dairy",
            "deli",
            "kiosk",
            "tea",
            "garden_centre",
            "hairdresser",
        }

        demand_amenities = {
            "hospital",
            "clinic",
            "school",
            "college",
            "university",
            "bank",
            "restaurant",
            "cafe",
            "fuel",
            "marketplace",
        }

        demand_offices = {
            "company",
            "it",
            "financial",
            "financial_advisor",
            "lawyer",
            "advertising_agency",
            "research",
            "insurance",
            "coworking",
        }

        if shop in commercial_shops:
            cells[cell]["commercial_pois"] += 1

        if amenity in demand_amenities:
            cells[cell]["demand_activity_pois"] += 1

        if office in demand_offices:
            cells[cell]["demand_activity_pois"] += 1

    return cells


def normalize(values, inverse=False):
    if not values:
        return {}

    minimum = min(values.values())
    maximum = max(values.values())

    if maximum == minimum:
        return {
            key: 50.0
            for key in values
        }

    result = {}

    for key, value in values.items():
        score = (
            (value - minimum)
            / (maximum - minimum)
        ) * 100

        if inverse:
            score = 100 - score

        result[key] = round(
            max(0.0, min(100.0, score)),
            1,
        )

    return result


def calculate_h3_readiness():
    cells = build_h3_grid()

    if not cells:
        return []

    poi_counts = {
        cell: data["poi_count"]
        for cell, data in cells.items()
    }

    commercial_counts = {
        cell: data["commercial_pois"]
        for cell, data in cells.items()
    }

    demand_counts = {
        cell: data["demand_activity_pois"]
        for cell, data in cells.items()
    }

    activity_scores = normalize(demand_counts)

    competition_opportunity = normalize(
        commercial_counts,
        inverse=True,
    )

    activity_density = normalize(poi_counts)

    results = []

    for cell, data in cells.items():

        demand_score = activity_scores[cell]
        opportunity_score = competition_opportunity[cell]

        readiness = round(
            demand_score * 0.45
            + opportunity_score * 0.35
            + activity_density[cell] * 0.20,
            1,
        )

        if readiness >= 70:
            category = "high-potential"
        elif readiness <= 30:
            category = "underserved"
        else:
            category = "moderate"

        boundary = h3.cell_to_boundary(cell)

        results.append(
            {
                "h3": cell,
                "center": {
                    "lat": round(data["lat"], 6),
                    "lng": round(data["lng"], 6),
                },
                "raw": {
                    "poi_count": data["poi_count"],
                    "commercial_pois": data["commercial_pois"],
                    "demand_activity_pois": data["demand_activity_pois"],
                },
                "scores": {
                    "demand": demand_score,
                    "competitive_opportunity": opportunity_score,
                    "activity_density": activity_density[cell],
                    "readiness": readiness,
                },
                "category": category,
                "boundary": boundary,
            }
        )

    results.sort(
        key=lambda item: item["scores"]["readiness"],
        reverse=True,
    )

    return results
