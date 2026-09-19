from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.scoring import SiteFactors, calculate_readiness
from app.api.sites import router as sites_router


app = FastAPI(
    title="GeoReadiness AI",
    description="AI-powered geospatial site readiness analyzer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScoreRequest(BaseModel):
    population: float
    accessibility: float
    competition: float
    land_use: float
    risk: float


@app.get("/")
def root():
    return {
        "service": "GeoReadiness AI",
        "status": "online",
        "region": "Gujarat, India",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "georeadiness-api",
    }


@app.post("/api/score")
def score_site(request: ScoreRequest):
    factors = SiteFactors(
        population=request.population,
        accessibility=request.accessibility,
        competition=request.competition,
        land_use=request.land_use,
        risk=request.risk,
    )

    return calculate_readiness(factors)


app.include_router(sites_router)
