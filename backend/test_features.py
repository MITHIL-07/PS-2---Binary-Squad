import json

from app.services.features import build_osm_features


features = build_osm_features()

print(
    json.dumps(
        features,
        indent=2,
    )
)
