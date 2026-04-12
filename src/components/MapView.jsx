import { useEffect, useRef } from 'react'
import {
  MapContainer, TileLayer, Marker, Popup,
  GeoJSON, Rectangle, useMap,
} from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function markerIcon(score) {
  const color = score >= 0.7 ? '#22c55e' : score >= 0.4 ? '#eab308' : '#ef4444'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html:        svg,
    className:   '',
    iconSize:    [24, 36],
    iconAnchor:  [12, 36],
    popupAnchor: [0, -36],
  })
}

function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 11, { duration: 1.5 })
  }, [center, zoom])
  return null
}

export default function MapView({
  center,
  zoom,
  markers  = [],
  geojsonLayers = {},
  bbox,
  onMapClick,
}) {
  return (
    <MapContainer
      center={center || [20.5937, 78.9629]}
      zoom={zoom || 5}
      className="w-full h-full rounded-xl"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && <FlyTo center={center} zoom={zoom} />}

      {/* Bounding box rectangle */}
      {bbox && (
        <Rectangle
          bounds={[
            [bbox.min_lat, bbox.min_lng],
            [bbox.max_lat, bbox.max_lng],
          ]}
          pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.05 }}
        />
      )}

      {/* OSM GeoJSON layers */}
      {Object.entries(geojsonLayers).map(([id, layer]) =>
        layer?.geojson ? (
          <GeoJSON
            key={id}
            data={layer.geojson}
            style={{ color: layer.color || '#3b82f6', weight: 2, fillOpacity: 0.3 }}
          />
        ) : null
      )}

      {/* Site markers */}
      {markers.map((site, i) => (
        <Marker
          key={site.site_id || i}
          position={[site.latitude, site.longitude]}
          icon={markerIcon(site.score)}
        >
          <Popup>
            <div className="text-sm min-w-32">
              <p className="font-bold text-gray-800 mb-1">Site #{i + 1}</p>
              <p className="text-gray-600 text-xs mb-2">ID: {site.site_id}</p>
              <p className="text-lg font-bold mb-2" style={{
                color: site.score >= 0.7 ? '#16a34a' : site.score >= 0.4 ? '#ca8a04' : '#dc2626'
              }}>
                Score: {Math.round(site.score * 100)}%
              </p>
              {site.breakdown && (
                <div className="space-y-1">
                  {Object.entries(site.breakdown).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs text-gray-600">
                      <span>{k.replace(/_/g, ' ')}</span>
                      <span>{Math.round(v * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}