'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { Property } from '@/lib/supabase'

// Set the Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

interface MarketMapProps {
  properties: Property[]
  marketName: string
  highlightedPropertyId?: string | null
  selectedPropertyId?: string | null
  hoveredPropertyId?: string | null
  onPropertyClick?: (propertyId: string) => void
  onPropertySelect?: (propertyId: string) => void
  isSatelliteView?: boolean
  territoryPolygon?: {
    type: string
    geometry: {
      type: string
      coordinates: number[][][]
    }
    properties: Record<string, unknown>
  }
  showTerritory?: boolean
  className?: string
}


export function MarketMap({ 
  properties, 
  highlightedPropertyId, 
  selectedPropertyId,
  hoveredPropertyId,
  onPropertyClick, 
  onPropertySelect,
  isSatelliteView = false,
  territoryPolygon,
  showTerritory = false,
  className = '' 
}: MarketMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!map.current) return
    
    // Check if click was on a marker (if so, don't unhighlight)
    const features = map.current.queryRenderedFeatures(e.point, {
      layers: []
    })
    
    // If no features were clicked (empty space), unhighlight
    if (features.length === 0) {
      if (onPropertySelect) {
        onPropertySelect('')
      }
      if (onPropertyClick) {
        onPropertyClick('')
      }
    }
  }, [onPropertySelect, onPropertyClick])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: isSatelliteView ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/streets-v12',
        center: [-98.5795, 39.8283], // Center of US as default
        zoom: 4,
        attributionControl: false
      })

      map.current.on('load', () => {
        setIsLoaded(true)
        // Trigger resize after load to ensure proper sizing
        setTimeout(() => {
          if (map.current) {
            map.current.resize()
          }
        }, 100)
      })

      map.current.on('error', (e) => {
        console.warn('Map error:', e)
      })

      // Add click handler to map to unhighlight when clicking on empty space
      map.current.on('click', handleMapClick)

    } catch (error) {
      console.error('Error initializing map:', error)
    }

    return () => {
      // Clear markers first
      markers.current.forEach(marker => {
        try {
          marker.remove()
        } catch (error) {
          console.warn('Error removing marker:', error)
        }
      })
      markers.current = []

      // Then remove map
      if (map.current) {
        try {
          map.current.remove()
        } catch (error) {
          console.warn('Error removing map:', error)
        }
        map.current = null
      }
    }
  }, [handleMapClick])

  useEffect(() => {
    if (!map.current || !isLoaded || properties.length === 0) return

    try {
      // Clear existing markers safely
      markers.current.forEach(marker => {
        try {
          marker.remove()
        } catch (error) {
          console.warn('Error removing marker:', error)
        }
      })
      markers.current = []

      // Calculate bounds from properties
      const validProperties = properties.filter(p => p.lat && p.lng)
      
      if (validProperties.length === 0) return

      const bounds = new mapboxgl.LngLatBounds()
      
      validProperties.forEach(property => {
        if (property.lat && property.lng) {
          const lngLat = [property.lng, property.lat] as [number, number]
          bounds.extend(lngLat)

          const isSelected = selectedPropertyId === property.id
          const isHovered = hoveredPropertyId === property.id

          // Create custom circle marker with highlighting
          const markerEl = document.createElement('div')
          markerEl.className = 'custom-marker'
          markerEl.style.cssText = `
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: ${isSelected ? '#1d4ed8' : isHovered ? '#2563eb' : '#3b82f6'};
            border: ${isSelected ? '4px solid #fbbf24' : isHovered ? '3px solid #fbbf24' : '3px solid white'};
            box-shadow: ${isSelected ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : isHovered ? '0 0 0 2px rgba(251, 191, 36, 0.2)' : '0 2px 4px rgba(0,0,0,0.3)'};
            cursor: pointer;
            transition: all 0.2s ease;
          `

          // Add click handler
          markerEl.addEventListener('click', (e) => {
            e.stopPropagation() // Prevent map click event
            if (onPropertySelect) {
              onPropertySelect(property.id)
            }
            if (onPropertyClick) {
              onPropertyClick(property.id)
            }
          })

          const marker = new mapboxgl.Marker(markerEl)
            .setLngLat(lngLat)
            .addTo(map.current)
          
          // Store marker reference for cleanup
          markers.current.push(marker)
        }
      })

      // Fit map to bounds
      if (validProperties.length > 1) {
        map.current.fitBounds(bounds, { 
          padding: 20,
          maxZoom: 12
        })
      } else if (validProperties.length === 1) {
        const property = validProperties[0]
        map.current.setCenter([property.lng!, property.lat!])
        map.current.setZoom(10)
      }
    } catch (error) {
      console.error('Error updating map markers:', error)
    }
  }, [properties, isLoaded, selectedPropertyId, hoveredPropertyId, onPropertySelect, onPropertyClick])

  // Resize map when container size changes
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        try {
          map.current.resize()
        } catch (error) {
          console.warn('Error resizing map:', error)
        }
      }
    })

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [isLoaded])

  // Handle satellite view toggle
  useEffect(() => {
    if (!map.current || !isLoaded) return

    try {
      const newStyle = isSatelliteView ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/streets-v12'
      map.current.setStyle(newStyle)
    } catch (error) {
      console.warn('Error changing map style:', error)
    }
  }, [isSatelliteView, isLoaded])

  // Handle territory polygon
  useEffect(() => {
    if (!map.current || !isLoaded || !territoryPolygon || !showTerritory) return

    try {
      // Add territory polygon to map
      if (map.current.getSource('territory')) {
        map.current.removeLayer('territory-fill')
        map.current.removeLayer('territory-stroke')
        map.current.removeSource('territory')
      }

      map.current.addSource('territory', {
        type: 'geojson',
        data: territoryPolygon
      })

      map.current.addLayer({
        id: 'territory-fill',
        type: 'fill',
        source: 'territory',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.1
        }
      })

      map.current.addLayer({
        id: 'territory-stroke',
        type: 'line',
        source: 'territory',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2
        }
      })
    } catch (error) {
      console.warn('Error adding territory polygon:', error)
    }

    return () => {
      if (map.current && map.current.getSource('territory')) {
        try {
          map.current.removeLayer('territory-fill')
          map.current.removeLayer('territory-stroke')
          map.current.removeSource('territory')
        } catch (error) {
          console.warn('Error removing territory polygon:', error)
        }
      }
    }
  }, [territoryPolygon, showTerritory, isLoaded])

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-xs">Mapbox token not configured</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '200px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-1"></div>
            <div className="text-xs">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  )
}