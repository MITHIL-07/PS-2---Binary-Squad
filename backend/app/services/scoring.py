from pydantic import BaseModel


class SiteFactors(BaseModel):
    population: float
    accessibility: float
    competition: float
    land_use: float
    risk: float


DEFAULT_WEIGHTS = {
    "population": 0.25,
    "accessibility": 0.20,
    "competition": 0.15,
    "land_use": 0.20,
    "risk": 0.20,
}


def clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def calculate_readiness(
    factors: SiteFactors,
    weights: dict[str, float] | None = None,
):
    weights = weights or DEFAULT_WEIGHTS

    # Higher competitive whitespace = better opportunity.
    competitive_opportunity = 100 - factors.competition

    score = (
        factors.population * weights["population"]
        + factors.accessibility * weights["accessibility"]
        + competitive_opportunity * weights["competition"]
        + factors.land_use * weights["land_use"]
        + factors.risk * weights["risk"]
    )

    score = round(clamp(score), 1)

    return {
        "score": score,
        "breakdown": {
            "population": factors.population,
            "accessibility": factors.accessibility,
            "competitive_opportunity": round(
                competitive_opportunity, 1
            ),
            "land_use": factors.land_use,
            "risk_resilience": factors.risk,
        },
        "weights": weights,
    }
