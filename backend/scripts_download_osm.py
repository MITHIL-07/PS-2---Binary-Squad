import time
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "data" / "osm"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Ahmedabad working area:
# south, west, north, east
BBOX = "22.95,72.40,23.15,72.70"

OVERPASS_ENDPOINTS = [
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

HEADERS = {
    "User-Agent": "GeoReadiness-AI-Hackathon/1.0"
}


def download(name: str, query: str):
    output = OUTPUT_DIR / f"{name}.json"

    for endpoint in OVERPASS_ENDPOINTS:
        print(f"\nTrying {endpoint}")
        print(f"Downloading {name}...")

        try:
            response = requests.post(
                endpoint,
                data={"data": query},
                headers=HEADERS,
                timeout=300,
            )

            if response.status_code == 200:
                output.write_text(response.text, encoding="utf-8")

                print(f"SUCCESS: {output}")
                print(f"Size: {output.stat().st_size / 1024:.1f} KB")

                time.sleep(3)
                return

            print(
                f"Server returned HTTP {response.status_code}"
            )

        except requests.RequestException as exc:
            print(f"Request failed: {exc}")

    raise RuntimeError(
        f"All Overpass endpoints failed while downloading {name}."
    )


# Major and useful road classes only.
# This keeps the first extraction manageable.
roads_query = f"""
[out:json][timeout:300];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential"]({BBOX});
);
out geom;
"""

# Start with commercially/demand-relevant POIs.
pois_query = f"""
[out:json][timeout:300];
(
  nwr["shop"]({BBOX});
  nwr["amenity"~"hospital|clinic|school|college|university|bank|fuel|restaurant|cafe"]({BBOX});
  nwr["office"]({BBOX});
);
out center;
"""

download("roads", roads_query)
download("pois", pois_query)

print("\nAhmedabad OSM extraction complete.")
