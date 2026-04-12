import { useState, useEffect } from 'react'
import { Layers, Loader2 } from 'lucide-react'
import { getSupportedLayers, fetchOSMLayer } from '../api/client'
import toast from 'react-hot-toast'

export default function LayerPanel({ bbox, onLayerUpdate }) {
  const [layers,   setLayers]   = useState([])
  const [active,   setActive]   = useState({})
  const [loading,  setLoading]  = useState({})

  useEffect(() => {
    getSupportedLayers()
      .then(({ data }) => setLayers(data.layers || []))
      .catch(() => {})
  }, [])

  const toggleLayer = async (layer) => {
    if (!bbox) {
      toast.error('Search for a location first')
      return
    }

    const isActive = active[layer.id]

    if (isActive) {
      // Remove layer
      setActive((prev) => { const n = { ...prev }; delete n[layer.id]; return n })
      onLayerUpdate && onLayerUpdate(layer.id, null)
      return
    }

    // Fetch layer
    setLoading((prev) => ({ ...prev, [layer.id]: true }))
    try {
      const { data } = await fetchOSMLayer(bbox, [layer.id])
      setActive((prev) => ({ ...prev, [layer.id]: { ...layer, geojson: data.geojson, count: data.feature_count } }))
      onLayerUpdate && onLayerUpdate(layer.id, { ...data, color: layer.color })
      toast.success(`${layer.label}: ${data.feature_count} features loaded`)
    } catch {
      toast.error(`Failed to load ${layer.label}`)
    } finally {
      setLoading((prev) => { const n = { ...prev }; delete n[layer.id]; return n })
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 w-52">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300">
        <Layers size={14} />
        <span>Map Layers</span>
      </div>

      <div className="space-y-2">
        {layers.map((layer) => {
          const isActive  = !!active[layer.id]
          const isLoading = !!loading[layer.id]

          return (
            <label
              key={layer.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleLayer(layer)}
                  className="sr-only"
                  disabled={isLoading}
                />
                <div className={`w-4 h-4 rounded border transition-colors ${
                  isActive
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-gray-800 border-gray-600 group-hover:border-gray-500'
                }`}>
                  {isActive && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Color dot */}
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: layer.color }} />

              <span className="text-sm text-gray-400 group-hover:text-gray-300 flex-1">{layer.label}</span>

              {isLoading && <Loader2 size={12} className="animate-spin text-blue-400" />}
              {isActive && active[layer.id]?.count !== undefined && (
                <span className="text-xs text-gray-500">{active[layer.id].count}</span>
              )}
            </label>
          )
        })}
      </div>

      {!bbox && (
        <p className="text-xs text-gray-600 mt-3">Search a location to enable layers</p>
      )}
    </div>
  )
}