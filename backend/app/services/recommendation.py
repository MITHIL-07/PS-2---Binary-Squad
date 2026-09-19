from app.services.scoring import calculate_readiness, SiteFactors


def classify_score(score: float) -> str:
    if score >= 70:
        return "High Potential"
    if score >= 50:
        return "Moderate Potential"
    return "Low Potential"


def build_recommendation(factors: SiteFactors):
    result = calculate_readiness(factors)

    breakdown = result["breakdown"]
    score = result["score"]

    strengths = []
    considerations = []

    factor_labels = {
        "population": "Population potential",
        "accessibility": "Accessibility",
        "competitive_opportunity": "Competitive opportunity",
        "land_use": "Land-use suitability",
        "risk_resilience": "Risk resilience",
    }

    for key, label in factor_labels.items():
        value = breakdown[key]

        if value >= 75:
            strengths.append(
                f"Strong {label.lower()}"
            )
        elif value < 50:
            considerations.append(
                f"Lower {label.lower()}"
            )

    category = classify_score(score)

    if score >= 70:
        summary = (
            "The location shows strong overall site readiness "
            "based on the evaluated factors."
        )
    elif score >= 50:
        summary = (
            "The location shows moderate site readiness and "
            "requires further evaluation of weaker factors."
        )
    else:
        summary = (
            "The location shows lower overall site readiness "
            "based on the evaluated factors."
        )

    return {
        "score": score,
        "category": category,
        "summary": summary,
        "strengths": strengths,
        "considerations": considerations,
        "breakdown": breakdown,
    }
