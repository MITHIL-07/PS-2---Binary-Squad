import json
import math
from pathlib import Path

import geopandas as gpd
from shapely.geometry import LineString, Point


BASE_DIR = Path(__file__).resolve().parents[2]
OSM_DIR = BASE_DIR / "data" / "osm"

# Ahmedabad candidate locations.
CANDIDATE_SITES = {
    "SG Highway": {
        "lat": 23.0339,
        "lng": 72.5067,
    },
    "Prahlad Nagar": {
        "lat": 23.0122,
        "lng": 72.5104,
    },
    "Bopal": {
        "lat": 23.0302,
        "lng": 72.4657,
    },
    "Naroda": {
        "lat": 23.0702,
        "lng": 72.6580,
    },
}

# Ahmedabad is approximately in UTM Zone 43N.
METRIC_CRS = "EPSG:32643"

MAJOR_ROADS = {
    "motorway",
    "trunk",
    "primary",
    "secondary",
}

COMMERCIAL_SHOPS = {
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

DEMAND_AMENITIES = {
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

DEMAND_OFFICES = {
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


def load_roads():
    path = OSM_DIR / "roads.json"

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    records = []

    for element in data.get("elements", []):
        if element.get("type") != "way":
            continue

        geometry = element.get("geometry")

        if not geometry or len(geometry) < 2:
            continue

        coordinates = [
            (point["lon"], point["lat"])
            for point in geometry
        ]

        records.append(
            {
                "osm_id": element.get("id"),
                "highway": element.get("tags", {}).get("highway"),
                "geometry": LineString(coordinates),
            }
        )

    roads = gpd.GeoDataFrame(
        records,
        geometry="geometry",
        crs="EPSG:4326",
    )

    return roads.to_crs(METRIC_CRS)


def load_pois():
    path = OSM_DIR / "pois.json"

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    records = []

    for element in data.get("elements", []):
        tags = element.get("tags", {})

        if element.get("type") == "node":

            if "lat" not in element or "lon" not in element:
                continue

            point = Point(
                element["lon"],
                element["lat"],
            )

        else:

            center = element.get("center")

            if not center:
                continue

            point = Point(
                center["lon"],
                center["lat"],
            )

        records.append(
            {
                "osm_id": element.get("id"),
                "name": tags.get("name"),
                "shop": tags.get("shop"),
                "amenity": tags.get("amenity"),
                "office": tags.get("office"),
                "tourism": tags.get("tourism"),
                "geometry": point,
            }
        )

    pois = gpd.GeoDataFrame(
        records,
        geometry="geometry",
        crs="EPSG:4326",
    )

    return pois.to_crs(METRIC_CRS)


def classify_poi(row):
    shop = row.get("shop")
    amenity = row.get("amenity")
    office = row.get("office")

    if shop in COMMERCIAL_SHOPS:
        return "commercial"

    if amenity in DEMAND_AMENITIES:
        return "demand"

    if office in DEMAND_OFFICES:
        return "demand"

    return "other"


def calculate_site_features(
    site_name: str,
    radius_km: float = 1.0,
):
    """
    Calculate real OSM-derived features for a candidate site.

    Distances and road lengths are measured in meters after
    transforming to UTM Zone 43N.
    """

    if site_name not in CANDIDATE_SITES:
        raise ValueError(f"Unknown site: {site_name}")

    roads = load_roads()
    pois = load_pois()

    site = CANDIDATE_SITES[site_name]

    site_point = gpd.GeoSeries(
        [
            Point(
                site["lng"],
                site["lat"],
            )
        ],
        crs="EPSG:4326",
    ).to_crs(METRIC_CRS).iloc[0]

    radius_m = radius_km * 1000

    # ---------------------------------------------------------
    # ROAD FEATURES
    # ---------------------------------------------------------

    nearby_roads = roads[
        roads.geometry.distance(site_point) <= radius_m
    ]

    major_roads = nearby_roads[
        nearby_roads["highway"].isin(MAJOR_ROADS)
    ]

    total_road_length_km = (
        nearby_roads.geometry.length.sum() / 1000
    )

    major_road_count = len(major_roads)

    if len(major_roads) > 0:
        nearest_major_road_km = (
            major_roads.geometry.distance(site_point).min()
            / 1000
        )
    else:
        nearest_major_road_km = None

    # ---------------------------------------------------------
    # POI FEATURES
    # ---------------------------------------------------------

    nearby_pois = pois[
        pois.geometry.distance(site_point) <= radius_m
    ].copy()

    nearby_pois["category"] = nearby_pois.apply(
        classify_poi,
        axis=1,
    )

    commercial_pois = nearby_pois[
        nearby_pois["category"] == "commercial"
    ]

    demand_pois = nearby_pois[
        nearby_pois["category"] == "demand"
    ]

    return {
        "site": site_name,
        "coordinates": {
            "lat": site["lat"],
            "lng": site["lng"],
        },
        "radius_km": radius_km,
        "road_features": {
            "road_length_km": round(
                total_road_length_km,
                3,
            ),
            "major_road_count": int(
                major_road_count
            ),
            "nearest_major_road_km": (
                round(
                    float(nearest_major_road_km),
                    3,
                )
                if nearest_major_road_km is not None
                else None
            ),
        },
        "poi_features": {
            "total_pois": int(len(nearby_pois)),
            "commercial_pois": int(
                len(commercial_pois)
            ),
            "demand_activity_pois": int(
                len(demand_pois)
            ),
            "other_pois": int(
                len(
                    nearby_pois[
                        nearby_pois["category"] == "other"
                    ]
                )
            ),
        },
    }
