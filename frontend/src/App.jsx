import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  Activity,
  ChevronRight,
  Layers3,
  MapPin,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { calculateSiteScore } from "./api";
import "./App.css";

const sites = [
  {
    id: "A",
    name: "SG Highway",
    area: "Sarkhej–Gandhinagar Highway",
    lat: 23.0339,
    lng: 72.5067,
    population: 92,
    accessibility: 96,
    competition: 68,
    land_use: 91,
    risk: 89,
  },
  {
    id: "B",
    name: "Prahlad Nagar",
    area: "Prahlad Nagar / Corporate Road",
    lat: 23.0122,
    lng: 72.5104,
    population: 88,
    accessibility: 87,
    competition: 61,
    land_use: 84,
    risk: 91,
  },
  {
    id: "C",
    name: "Bopal",
    area: "Bopal–Ambli Road",
    lat: 23.0302,
    lng: 72.4657,
    population: 82,
    accessibility: 78,
    competition: 49,
    land_use: 81,
    risk: 90,
  },
  {
    id: "D",
    name: "Naroda",
    area: "Naroda / East Ahmedabad",
    lat: 23.0702,
    lng: 72.658,
    population: 76,
    accessibility: 73,
    competition: 42,
    land_use: 74,
    risk: 82,
  },
];

const layers = [
  {
    id: "population",
    name: "Population Density",
    color: "blue",
  },
  {
    id: "roads",
    name: "Road Accessibility",
    color: "green",
  },
  {
    id: "competition",
    name: "Competitors / POIs",
    color: "orange",
  },
  {
    id: "landuse",
    name: "Land Use",
    color: "purple",
  },
  {
    id: "risk",
    name: "Environmental Risk",
    color: "yellow",
  },
];

function App() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [selectedId, setSelectedId] = useState("A");
  const [scoreData, setScoreData] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [opacity, setOpacity] = useState(75);

  const [enabledLayers, setEnabledLayers] = useState({
    population: true,
    roads: true,
    competition: true,
    landuse: true,
    risk: true,
  });

  const selectedSite = sites.find((site) => site.id === selectedId);

  // Create MapLibre map.
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "� OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm",
          paint: {
            "raster-opacity": 1,
          },
        },
      ],
    },
      center: [72.535, 23.035],
      zoom: 11.4,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.resize();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers whenever the selected site changes.
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    sites.forEach((site) => {
      const element = document.createElement("div");
      element.className = "site-marker";
      element.style.cursor = "pointer";

      const score = site.id === selectedId && scoreData
        ? scoreData.score
        : null;

      element.innerHTML = `
        <div class="marker-pulse"></div>
        <div class="marker-score">
          ${score !== null ? Math.round(score) : site.id}
        </div>
      `;

      element.addEventListener("click", () => {
        setSelectedId(site.id);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [site.lng, site.lat],
            zoom: 13,
            duration: 700,
          });
        }
      });

      const marker = new maplibregl.Marker({
        element,
      })
        .setLngLat([site.lng, site.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [selectedId, scoreData]);

  // Send selected site factors to FastAPI.
  useEffect(() => {
    if (!selectedSite) return;

    let cancelled = false;

    async function loadScore() {
      setLoadingScore(true);

      try {
        const result = await calculateSiteScore({
          population: selectedSite.population,
          accessibility: selectedSite.accessibility,
          competition: selectedSite.competition,
          land_use: selectedSite.land_use,
          risk: selectedSite.risk,
        });

        if (!cancelled) {
          setScoreData(result);
        }
      } catch (error) {
        console.error("Score API error:", error);

        if (!cancelled) {
          setScoreData(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingScore(false);
        }
      }
    }

    loadScore();

    return () => {
      cancelled = true;
    };
  }, [selectedId, selectedSite]);

  const toggleLayer = (id) => {
    setEnabledLayers((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const score = scoreData?.score ?? 0;
  const breakdown = scoreData?.breakdown ?? {};

  const metrics = [
    {
      label: "Population Demand",
      value: breakdown.population ?? selectedSite.population,
      icon: Users,
    },
    {
      label: "Road Accessibility",
      value: breakdown.accessibility ?? selectedSite.accessibility,
      icon: Route,
    },
    {
      label: "Competitive Opportunity",
      value:
        breakdown.competitive_opportunity ??
        100 - selectedSite.competition,
      icon: Target,
    },
    {
      label: "Land-use Suitability",
      value: breakdown.land_use ?? selectedSite.land_use,
      icon: Layers3,
    },
    {
      label: "Risk Resilience",
      value: breakdown.risk_resilience ?? selectedSite.risk,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>

          <div>
            <div className="brand-title">GeoReadiness AI</div>
            <div className="brand-subtitle">
              Spatial intelligence for site selection
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="location-pill">
            <MapPin size={15} />
            Gujarat • Ahmedabad
          </div>

          <div className="ai-status">
            <span className="status-dot"></span>
            Spatial engine online
          </div>
        </div>
      </header>

      <main className="app">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <Zap size={14} />
              AI-POWERED GEOSPATIAL ANALYSIS
            </div>

            <h1>Find locations that are ready to win.</h1>

            <p>
              Analyze demand, accessibility, competition, land use and
              environmental resilience across Ahmedabad.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={() => {
              setSelectedId(selectedId);
              setScoreData(null);
            }}
          >
            <RefreshCw size={16} />
            Recalculate
          </button>
        </section>

        <section className="dashboard-grid">
          <aside className="left-panel">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <div className="section-heading">Data layers</div>
                  <div className="analysis-chip">
                    {Object.values(enabledLayers).filter(Boolean).length} active
                  </div>
                </div>
              </div>

              <div className="layer-list">
                {layers.map((layer) => (
                  <div className="layer-row" key={layer.id}>
                    <div className="layer-name">
                      <span className={`layer-dot ${layer.color}`}></span>
                      {layer.name}
                    </div>

                    <button
                      className={`toggle ${
                        enabledLayers[layer.id] ? "toggle-on" : ""
                      }`}
                      onClick={() => toggleLayer(layer.id)}
                      aria-label={`Toggle ${layer.name}`}
                    >
                      <span></span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="opacity-control">
                <div className="opacity-header">
                  <span>Layer opacity</span>
                  <span>{opacity}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(event) => setOpacity(event.target.value)}
                />
              </div>
            </div>

            <div className="panel">
              <div className="section-heading">Candidate sites</div>

              <div className="site-list">
                {sites.map((site) => {
                  const active = site.id === selectedId;

                  return (
                    <button
                      className={`candidate ${
                        active ? "candidate-active" : ""
                      }`}
                      key={site.id}
                      onClick={() => {
                        setSelectedId(site.id);

                        if (mapRef.current) {
                          mapRef.current.flyTo({
                            center: [site.lng, site.lat],
                            zoom: 13,
                            duration: 700,
                          });
                        }
                      }}
                    >
                      <div className="candidate-info">
                        <span className="candidate-score">
                          {site.id}
                        </span>

                        <div>
                          <strong>{site.name}</strong>
                          <small>{site.area}</small>
                        </div>
                      </div>

                      <ChevronRight size={17} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="map-panel">
            <div className="map-container" ref={mapContainer}></div>

            <div className="map-overlay">
              <div className="map-location">
                <MapPin size={15} />
                Ahmedabad Metropolitan Area
              </div>

              <div className="map-status">
                <Activity size={14} />
                {loadingScore ? "Calculating..." : "Analysis ready"}
              </div>
            </div>

            <div className="map-legend">
              <div>
                <span className="legend-dot green"></span>
                Candidate
              </div>

              <div>
                <span className="legend-dot blue"></span>
                Selected
              </div>
            </div>
          </section>

          <aside className="right-panel">
            <div className="panel selected-site">
              <div className="section-heading">Selected site</div>

              <div className="location-pill">
                <MapPin size={15} />
                {selectedSite.name}
              </div>

              <div className="score-ring">
                <div
                  className="score-ring-inner"
                  style={{
                    "--score": `${score}%`,
                  }}
                >
                  <strong>
                    {loadingScore ? "…" : Math.round(score)}
                  </strong>
                  <span>/ 100</span>
                </div>
              </div>

              <div className="metric-list">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  const value = Math.round(metric.value);

                  return (
                    <div className="metric" key={metric.label}>
                      <div className="metric-top">
                        <div className="metric-label">
                          <Icon size={15} />
                          {metric.label}
                        </div>

                        <strong>{value}</strong>
                      </div>

                      <div className="metric-bar">
                        <span style={{ width: `${value}%` }}></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="compare-button">
                <Target size={16} />
                Compare this site
              </button>
            </div>

            <div className="panel explanation">
              <div className="explanation-title">
                <Sparkles size={16} />
                AI explanation
              </div>

              <p>
                {loadingScore
                  ? "Analyzing the selected location..."
                  : `${selectedSite.name} scores ${Math.round(
                      score
                    )}/100 based on demand, accessibility, competitive whitespace,
                    land-use suitability and environmental resilience.`}
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
