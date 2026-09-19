from .geospatial import calculate_site_features


def min_max(values: dict[str, float], inverse: bool = False):
    """
    Normalize values to 0-100.

    inverse=True means lower raw values receive higher scores.
    """

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


def build_osm_features():
    """
    Build normalized OSM-derived indicators
    for all four candidate sites.
    """

    raw = {}

    for site in [
        "SG Highway",
        "Prahlad Nagar",
        "Bopal",
        "Naroda",
    ]:
        raw[site] = calculate_site_features(site)

    # ---------------------------------------------------------
    # ACCESSIBILITY
    # ---------------------------------------------------------

    road_length = {
        site: data["road_features"]["road_length_km"]
        for site, data in raw.items()
    }

    major_roads = {
        site: data["road_features"]["major_road_count"]
        for site, data in raw.items()
    }

    road_distance = {
        site: (
            data["road_features"]["nearest_major_road_km"]
            if data["road_features"]["nearest_major_road_km"]
            is not None
            else 2.0
        )
        for site, data in raw.items()
    }

    road_length_score = min_max(road_length)

    major_road_score = min_max(major_roads)

    proximity_score = min_max(
        road_distance,
        inverse=True,
    )

    accessibility = {}

    for site in raw:

        accessibility[site] = round(
            (
                road_length_score[site] * 0.35
                + major_road_score[site] * 0.30
                + proximity_score[site] * 0.35
            ),
            1,
        )

    # ---------------------------------------------------------
    # COMPETITION
    # ---------------------------------------------------------

    commercial = {
        site: data["poi_features"]["commercial_pois"]
        for site, data in raw.items()
    }

    competition_density = min_max(commercial)

    competitive_opportunity = {
        site: round(
            100 - competition_density[site],
            1,
        )
        for site in raw
    }

    # ---------------------------------------------------------
    # ACTIVITY / DEMAND PROXY
    # ---------------------------------------------------------

    activity = {
        site: data["poi_features"]["demand_activity_pois"]
        for site, data in raw.items()
    }

    activity_score = min_max(activity)

    # ---------------------------------------------------------
    # FINAL FEATURE SET
    # ---------------------------------------------------------

    result = {}

    for site in raw:

        result[site] = {
            "source": "OpenStreetMap",
            "raw": {
                "road_length_km": road_length[site],
                "major_road_count": major_roads[site],
                "nearest_major_road_km": road_distance[site],
                "commercial_pois": commercial[site],
                "demand_activity_pois": activity[site],
            },
            "scores": {
                "accessibility": accessibility[site],
                "competitive_opportunity": competitive_opportunity[site],
                "activity_demand_proxy": activity_score[site],
            },
        }

    return result
