import { useState, useCallback } from 'react'
import { geocodeLocation, detectSites } from '../api/client'
import toast from 'react-hot-toast'

export default function useSiteAnalysis() {
  const [location, setLocation] = useState(null)
  const [sites,    setSites]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [useCase,  setUseCase]  = useState('solar_farm')
  const [topN,     setTopN]     = useState(5)

  const geocode = useCallback(async (query) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const { data } = await geocodeLocation(query)
      if (!data.success) {
        toast.error(`Location "${query}" not found`)
        return
      }
      const bb = data.bounding_box // [min_lat, max_lat, min_lng, max_lng]
      setLocation({
        lat:          data.latitude,
        lng:          data.longitude,
        display_name: data.display_name,
        bbox: bb ? {
          min_lat: parseFloat(bb[0]),
          max_lat: parseFloat(bb[1]),
          min_lng: parseFloat(bb[2]),
          max_lng: parseFloat(bb[3]),
        } : null,
      })
      setSites([])
      toast.success(`Found: ${data.display_name}`)
    } catch (err) {
      toast.error('Geocoding failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const analyze = useCallback(async () => {
    if (!location?.bbox) {
      toast.error('Please search for a location first')
      return
    }
    setLoading(true)
    try {
      const { data } = await detectSites(location.bbox, useCase, topN)
      if (!data.success) {
        toast.error('Site analysis failed')
        return
      }
      setSites(data.top_sites || [])
      toast.success(`Found ${data.top_sites.length} top sites out of ${data.total_candidates} candidates`)
    } catch (err) {
      toast.error('Site analysis failed')
    } finally {
      setLoading(false)
    }
  }, [location, useCase, topN])

  return {
    location, sites, loading,
    useCase,  setUseCase,
    topN,     setTopN,
    geocode,  analyze,
  }
}