import json
from functools import lru_cache
from pathlib import Path


DATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "site_features.json"
)


@lru_cache(maxsize=1)
def build_osm_features():
    """
    Load precomputed OSM-derived indicators.

    Heavy GeoPandas/Shapely processing is performed offline.
    Render only loads the compact feature result.
    """
    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)
