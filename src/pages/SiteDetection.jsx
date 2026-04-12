import { useState, useEffect } from 'react'
import { MapPin, Loader2, BarChart2, ChevronDown } from 'lucide-react'
import MapView from '../components/MapView'
import SearchBar from '../components/SearchBar'
import SiteCard from '../components/SiteCard'
import useSiteAnalysis from '../hooks/useSiteAnalysis'
import { getUseCases } from '../api/client'

export default function SiteDetection() {
  const {
    location, sites, loading,
    useCase, setUseCase,
    topN,    setTopN,
    geocode, analyze,
  } = useSiteAnalysis()

  const [useCases,      setUseCases]      = useState([])
  const [focusedSite,   setFocusedSite]   = useState(null)
  const [mapCenter,     setMapCenter]     = useState(null)

  useEffect(() => {
    getUseCases()
      .then(({ data }) => setUseCases(data.use_cases || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (location) setMapCenter([location.lat, location.lng])
  }, [location])

  const handleFocus = (site) => {
    setFocusedSite(site)
    setMapCenter([site.latitude, site.longitude])
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">

      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col border-r border-gray-800 bg-gray-900 overflow-y-auto flex-shrink-0">

        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-blue-400" />
            Site Detection
          </h1>
          <p className="text-xs text-gray-500">Find optimal locations for your use case</p>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4 border-b border-gray-800">

          {/* Search */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Location</label>
            <SearchBar
              onSearch={geocode}
              loading={loading}
              result={location?.display_name}
              placeholder="e.g. Ahmedabad, Gujarat"
            />
          </div>

          {/* Use case */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Use Case</label>
            <div className="relative">
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500 transition-colors pr-8"
              >
                {useCases.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
                {useCases.length === 0 && (
                  <option value="solar_farm">Solar Farm</option>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Top N */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Top Results: <span className="text-white">{topN}</span>
            </label>
            <input
              type="range"
              min={1} max={10} value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1</span><span>10</span>
            </div>
          </div>

          {/* Analyze button */}
          <button
            onClick={analyze}
            disabled={loading || !location}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
              : <><BarChart2 size={16} /> Analyze Sites</>
            }
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {sites.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">
                {sites.length} top sites found
              </p>
              {sites.map((site, i) => (
                <SiteCard
                  key={site.site_id}
                  site={site}
                  rank={i + 1}
                  onFocus={handleFocus}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <MapPin size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Search a location and analyze sites to see results</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Map ────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapView
          center={mapCenter}
          zoom={mapCenter ? 11 : 5}
          markers={sites}
          bbox={location?.bbox}
        />

        {/* Overlay info */}
        {sites.length > 0 && (
          <div className="absolute top-3 left-3 bg-gray-900/90 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 backdrop-blur-sm z-10">
            <span className="text-blue-400 font-medium">{sites.length} sites</span> found for{' '}
            <span className="text-white">{useCase.replace('_', ' ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}