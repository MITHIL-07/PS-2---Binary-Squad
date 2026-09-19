from app.services.geospatial import calculate_site_features


sites = [
    "SG Highway",
    "Prahlad Nagar",
    "Bopal",
    "Naroda",
]


for site in sites:
    print("\n" + "=" * 60)
    print(site)
    print("=" * 60)

    result = calculate_site_features(site)

    print(result)
