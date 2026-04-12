import { useState } from 'react'
import { Map } from 'lucide-react'
import MapView from '../components/MapView'
import SearchBar from '../components/SearchBar'
import LayerPanel from '../components/LayerPanel'
import { geocodeLocation } from '../api/client'
import toast from 'react-hot-toast'

export default function MapExplorer() {
  const [location,      setLocation]      = useState(null)
  const [searchLoading, setSearchLoading] = useState(null)
  const [geojsonLayers, setGeojsonLayers] = useState({})
  const [mapCenter,     setMapCenter]     = useState(null)

  const handleSearch = async (query) => {
    setSearchLoading(true)
    try {
      const { data } = await geocodeLocation(query)
      if (!data.success) {
        toast.error(`"${query}" not found`)
        return
      }
      const bb = data.bounding_box
      const loc = {
        lat:          data.latitude,
        lng:          data.longitude,
        display_name: data.display_name,
        bbox: bb ? {
          min_lat: parseFloat(bb[0]),
          max_lat: parseFloat(bb[1]),
          min_lng: parseFloat(bb[2]),
          max_lng: parseFloat(bb[3]),
        } : null,
      }
      setLocation(loc)
      setMapCenter([data.latitude, data.longitude])
      setGeojsonLayers({}) // Reset layers on new search
      toast.success(`Found: ${data.display_name}`)
    } catch {
      toast.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleLayerUpdate = (layerId, layerData) => {
    setGeojsonLayers((prev) => {
      if (!layerData) {
        const next = { ...prev }
        delete next[layerId]
        return next
      }
      return { ...prev, [layerId]: layerData }
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <Map size={18} className="text-blue-400 flex-shrink-0" />
        <div className="flex-1 max-w-md">
          <SearchBar
            onSearch={handleSearch}
            loading={searchLoading}
            result={location?.display_name}
            placeholder="Search any location..."
          />
        </div>
        {location && (
          <div className="text-xs text-gray-500 hidden sm:block">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Map + Layer panel */}
      <div className="flex-1 relative overflow-hidden">
        <MapView
          center={mapCenter}
          zoom={mapCenter ? 12 : 5}
          geojsonLayers={geojsonLayers}
          bbox={location?.bbox}
        />

        {/* Layer panel overlay */}
        <div className="absolute top-3 right-3 z-10">
          <LayerPanel
            bbox={location?.bbox}
            onLayerUpdate={handleLayerUpdate}
          />
        </div>

        {/* Empty state */}
        {!location && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl px-6 py-4 text-center backdrop-blur-sm">
              <Map size={28} className="text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Search a location to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}