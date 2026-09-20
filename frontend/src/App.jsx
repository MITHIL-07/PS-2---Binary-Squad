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

import {
  getSites,
  getH3Readiness,
  getSiteRecommendation,
  getSiteAnalyses,
} from "./api";

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
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [siteAnalyses, setSiteAnalyses] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const [loadingScore, setLoadingScore] = useState(false);
  const [osmSites, setOsmSites] = useState({});
  const [osmLoading, setOsmLoading] = useState(true);
  const [osmError, setOsmError] = useState("");

  const [opacity, setOpacity] = useState(75);
  const [h3Data, setH3Data] = useState(null);
  const [h3Loading, setH3Loading] = useState(true);
  const [showH3, setShowH3] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Load H3 site-readiness GeoJSON from the backend.
  useEffect(() => {
    async function loadH3Readiness() {
      try {
        const data = await getH3Readiness();

        setH3Data(data);
      } catch (error) {
        console.error("[H3] Failed to load readiness data:", error);
      } finally {
        setH3Loading(false);
      }
    }

    loadH3Readiness();
  }, []);

  const selectedSite = sites.find((site) => site.id === selectedId);

  const selectedOSM = selectedSite
    ? osmSites[selectedSite.name]
    : null;

  const realAccessibility =
    selectedOSM?.scores?.accessibility ??
    selectedSite?.accessibility ??
    0;

  const realCompetitiveOpportunity =
    selectedOSM?.scores?.competitive_opportunity ??
    (100 - (selectedSite?.competition ?? 0));

  const realActivityDemand =
    selectedOSM?.scores?.activity_demand_proxy ??
    0;

  const [enabledLayers, setEnabledLayers] = useState({

    population: true,

    roads: true,

    competition: true,

    landuse: true,

    risk: true,

  });

  // Create MapLibre map.

  useEffect(() => {
    async function loadOSMSites() {
      try {
        setOsmLoading(true);
        setOsmError("");

        const data = await getSites();

        if (!data || !data.sites) {
          throw new Error("Invalid OSM API response");
        }

        setOsmSites(data.sites);
      } catch (error) {
        console.error("Failed to load OSM site data:", error);
        setOsmError("Unable to load OpenStreetMap data");
      } finally {
        setOsmLoading(false);
      }
    }

    loadOSMSites();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSiteAnalyses() {
      setComparisonLoading(true);

      try {
        const data = await getSiteAnalyses();

        if (!cancelled) {
          setSiteAnalyses(data?.sites ?? []);
        }
      } catch (error) {
        console.error("Site comparison API error:", error);

        if (!cancelled) {
          setSiteAnalyses([]);
        }
      } finally {
        if (!cancelled) {
          setComparisonLoading(false);
        }
      }
    }

    loadSiteAnalyses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,

        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
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

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.on("load", () => {
      map.resize();
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render H3 readiness after both API data and MapLibre are ready.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !h3Data) {
      return;
    }

    const renderH3 = () => {

      if (!map.getSource("h3-readiness")) {

        map.addSource("h3-readiness", {
          type: "geojson",
          data: h3Data,
        });

        map.addLayer({
          id: "h3-readiness-fill",
          type: "fill",
          source: "h3-readiness",
          paint: {
            "fill-color": [
              "step",
              ["get", "readiness"],
              "#ef4444",
              30,
              "#f59e0b",
              70,
              "#22c55e"
            ],
            "fill-opacity": 0.48
          }
        });

        map.addLayer({
          id: "h3-readiness-outline",
          type: "line",
          source: "h3-readiness",
          paint: {
            "line-color": "#ffffff",
            "line-width": 0.8,
            "line-opacity": 0.7
          }
        });

        map.on("click", "h3-readiness-fill", (event) => {
          const feature = event.features?.[0];

          if (!feature) return;

          const p = feature.properties;

          new maplibregl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(`
              <div style="font-family: sans-serif; min-width: 190px;">
                <strong>H3 Site Readiness</strong>
                <div style="margin-top: 8px;">
                  <b>Readiness:</b> ${p.readiness}
                </div>
                <div>
                  <b>Category:</b> ${p.category}
                </div>
                <div>
                  <b>POIs:</b> ${p.poi_count}
                </div>
                <div>
                  <b>Commercial:</b> ${p.commercial_pois}
                </div>
                <div>
                  <b>Demand Activity:</b> ${p.demand_activity_pois}
                </div>
              </div>
            `)
            .addTo(map);
        });

        map.on("mouseenter", "h3-readiness-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "h3-readiness-fill", () => {
          map.getCanvas().style.cursor = "";
        });

      } else {
        map.getSource("h3-readiness").setData(h3Data);
      }

      map.setPaintProperty(
        "h3-readiness-fill",
        "fill-opacity",
        showH3 ? 0.48 : 0
      );

      map.setPaintProperty(
        "h3-readiness-outline",
        "line-opacity",
        showH3 ? 0.7 : 0
      );
    };

    if (map.loaded()) {
      renderH3();
    } else {
      map.once("load", renderH3);
    }
  }, [h3Data, mapReady, showH3]);

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

    async function loadScoreAndRecommendation() {

      setLoadingScore(true);

      setLoadingRecommendation(true);

      const factors = {

        population: selectedSite.population,

        accessibility: realAccessibility,

        competition: 100 - realCompetitiveOpportunity,

        land_use: selectedSite.land_use,

        risk: selectedSite.risk,

      };

      try {

        const [analysisResult, recommendationResult] =

          await Promise.all([

            getSiteAnalyses(),

            getSiteRecommendation(factors),

          ]);

        const selectedAnalysis = analysisResult?.sites?.find(

          (site) => site.id === selectedId

        );

        if (!cancelled) {

          if (selectedAnalysis) {

            setScoreData({

              score: selectedAnalysis.score,

              breakdown: selectedAnalysis.breakdown,

            });

          } else {

            setScoreData(null);

          }

          setRecommendation(recommendationResult);

        }

      } catch (error) {

        console.error("Score/recommendation API error:", error);

        if (!cancelled) {

          setScoreData(null);

          setRecommendation(null);

        }

      } finally {

        if (!cancelled) {

          setLoadingScore(false);

          setLoadingRecommendation(false);

        }

      }

    }

    loadScoreAndRecommendation();

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

      <div className="osm-status">
        <span className={`osm-status-dot ${
          osmError ? "osm-status-error" : osmLoading ? "osm-status-loading" : ""
        }`}></span>

        {osmError
          ? osmError
          : osmLoading
            ? "Loading OpenStreetMap data..."
            : "OpenStreetMap data connected • Ahmedabad"}
      </div>

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

              <button
                className="compare-button"
                onClick={() => setShowComparison((current) => !current)}
              >

                <Target size={16} />

                {showComparison ? "Hide comparison" : "Compare this site"}

              </button>

            </div>

            {showComparison && (

              <div className="panel site-comparison">

                <div className="explanation-title">

                  <Target size={16} />

                  Ahmedabad Site Comparison

                </div>

                <div className="comparison-subtitle">

                  Compare the current candidate locations using the same readiness model.

                </div>

                <div className="comparison-list">

                  {comparisonLoading ? (

                    <div className="comparison-loading">

                      Loading site analysis...

                    </div>

                  ) : siteAnalyses.length === 0 ? (

                    <div className="comparison-loading">

                      Site analysis data unavailable.

                    </div>

                  ) : (

                    siteAnalyses.map((analysis) => (

                      <button

                        className={`comparison-row ${
                          analysis.id === selectedId
                            ? "comparison-row-active"
                            : ""
                        }`}

                        key={analysis.id}

                        onClick={() => {

                          setSelectedId(analysis.id);

                          setShowComparison(false);

                          if (mapRef.current) {

                            mapRef.current.flyTo({

                              center: [analysis.lng, analysis.lat],

                              zoom: 13,

                              duration: 700,

                            });

                          }

                        }}

                      >

                        <div className="comparison-site-info">

                          <strong>{analysis.name}</strong>

                          <span>{analysis.category}</span>

                        </div>

                        <div className="comparison-score">

                          <strong>{Math.round(analysis.score)}</strong>

                          <span>/100</span>

                        </div>

                      </button>

                    ))

                  )}

                </div>

              </div>

            )}

            <div className="panel explanation">

              <div className="explanation-title">

                <Sparkles size={16} />

                AI Site Intelligence

              </div>

              {loadingRecommendation ? (

                <p>Analyzing the selected location...</p>

              ) : recommendation ? (

                <>

                  <div className="ai-recommendation-header">

                    <div>

                      <div className="ai-recommendation-category">

                        {recommendation.category}

                      </div>

                      <div className="ai-recommendation-score">

                        {Math.round(recommendation.score)}

                        <span>/100</span>

                      </div>

                    </div>

                  </div>

                  <p className="ai-recommendation-summary">

                    {recommendation.summary}

                  </p>

                  {recommendation.strengths?.length > 0 && (

                    <div className="ai-recommendation-section">

                      <div className="ai-recommendation-section-title">

                        <ShieldCheck size={14} />

                        Strengths

                      </div>

                      <ul>

                        {recommendation.strengths.map((item) => (

                          <li key={item}>{item}</li>

                        ))}

                      </ul>

                    </div>

                  )}

                  {recommendation.considerations?.length > 0 && (

                    <div className="ai-recommendation-section">

                      <div className="ai-recommendation-section-title">

                        <Target size={14} />

                        Considerations

                      </div>

                      <ul>

                        {recommendation.considerations.map((item) => (

                          <li key={item}>{item}</li>

                        ))}

                      </ul>

                    </div>

                  )}

                </>

              ) : (

                <p>

                  Select a site to generate an AI-powered site intelligence summary.

                </p>

              )}

            </div>

          </aside>

        </section>

      </main>

    </div>

  );

}

export default App;

