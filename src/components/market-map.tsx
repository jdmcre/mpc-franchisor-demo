'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Property } from '@/lib/supabase'

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

interface MarketMapProps {
  properties: Property[]
  marketName: string
  className?: string
  selectedPropertyId?: string
  hoveredPropertyId?: string
  isSatelliteView?: boolean
  onPropertySelect?: (propertyId: string) => void
  territoryPolygon?: {
    id: string
    type: string
    geometry: {
      type: string
      coordinates: number[][][]
    }
    properties: Record<string, unknown>
  }
  showTerritory?: boolean
}

export function MarketMap({ properties, marketName, className = '', selectedPropertyId, hoveredPropertyId, isSatelliteView = false, onPropertySelect, territoryPolygon, showTerritory = false }: MarketMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const resizeObserver = useRef<ResizeObserver | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const abortController = useRef<AbortController | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  // Calculate center point and optimal zoom from properties using useMemo
  const { centerLat, centerLng, zoom } = useMemo(() => {
    let lat = 39.7392 // Default to Denver
    let lng = -104.9903
    let z = 10

    if (properties.length > 0) {
      // Filter properties with valid coordinates
      const validProperties = properties.filter((p): p is Property & { lat: number; lng: number } => 
        typeof p.lat === 'number' && 
        typeof p.lng === 'number' && 
        !isNaN(p.lat) && 
        !isNaN(p.lng)
      )
      
      if (validProperties.length > 0) {
        // Calculate center from valid properties
        lat = validProperties.reduce((sum, p) => sum + p.lat, 0) / validProperties.length
        lng = validProperties.reduce((sum, p) => sum + p.lng, 0) / validProperties.length
        
        // Calculate bounds to fit all markers
        if (validProperties.length === 1) {
          // For single property, zoom in close
          z = 15
        } else {
          // Calculate bounds for multiple properties
          const lats = validProperties.map(p => p.lat)
          const lngs = validProperties.map(p => p.lng)
          
          const minLat = Math.min(...lats)
          const maxLat = Math.max(...lats)
          const minLng = Math.min(...lngs)
          const maxLng = Math.max(...lngs)
          
          // Calculate the span of coordinates
          const latSpan = maxLat - minLat
          const lngSpan = maxLng - minLng
          const maxSpan = Math.max(latSpan, lngSpan)
          
          // Add padding to the bounds (10% on each side)
          const padding = 0.1
          const paddedSpan = maxSpan * (1 + 2 * padding)
          
          // Calculate zoom level based on span
          // These values are approximate and may need fine-tuning
          if (paddedSpan > 10) {
            z = 4
          } else if (paddedSpan > 5) {
            z = 5
          } else if (paddedSpan > 2) {
            z = 6
          } else if (paddedSpan > 1) {
            z = 7
          } else if (paddedSpan > 0.5) {
            z = 8
          } else if (paddedSpan > 0.2) {
            z = 9
          } else if (paddedSpan > 0.1) {
            z = 10
          } else if (paddedSpan > 0.05) {
            z = 11
          } else if (paddedSpan > 0.02) {
            z = 12
          } else if (paddedSpan > 0.01) {
            z = 13
          } else if (paddedSpan > 0.005) {
            z = 14
          } else {
            z = 15
          }
        }
      }
    }

    return { centerLat: lat, centerLng: lng, zoom: z }
  }, [properties])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Create abort controller for this effect
    abortController.current = new AbortController()
    const signal = abortController.current.signal

    try {
      // Check if signal is already aborted before creating map
      if (signal.aborted) return

      // Double-check that container still exists and is in DOM
      if (!mapContainer.current || !mapContainer.current.parentNode) return

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: isSatelliteView ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12',
        center: [centerLng, centerLat],
        zoom: zoom,
        attributionControl: false
      })

      map.current.on('load', () => {
        // Check if component is still mounted and signal not aborted
        if (signal.aborted || !mapContainer.current) return
        setMapLoaded(true)
        // Resize the map after it loads to ensure proper dimensions
        if (map.current && !signal.aborted && mapContainer.current) {
          try {
            map.current.resize()
          } catch (resizeError) {
            console.warn('Error resizing map:', resizeError)
          }
        }
      })

      // Add click handler to map to clear selection when clicking on empty areas
      map.current.on('click', (e) => {
        // Only clear selection if clicking on the map itself (not on markers)
        if (onPropertySelect && !signal.aborted) {
          onPropertySelect('')
        }
      })

      // Set up ResizeObserver to handle container size changes (e.g., sidebar collapse/expand)
      if (mapContainer.current && !signal.aborted) {
        resizeObserver.current = new ResizeObserver(() => {
          if (map.current && !signal.aborted && mapContainer.current) {
            try {
              map.current.resize()
            } catch (resizeError) {
              console.warn('Error resizing map:', resizeError)
            }
          }
        })
        resizeObserver.current.observe(mapContainer.current)
      }
    } catch (error) {
      if (!signal.aborted) {
        console.warn('Error initializing map:', error)
      }
    }

    return () => {
      // Abort any ongoing operations
      if (abortController.current) {
        try {
          abortController.current.abort()
        } catch (error) {
          // Ignore abort errors - controller might already be aborted
          console.warn('AbortController cleanup warning:', error)
        }
      }

      // Clean up markers
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          try {
            marker.remove()
          } catch (error) {
            console.warn('Marker cleanup warning:', error)
          }
        }
      })
      markersRef.current = []

      // Clean up ResizeObserver
      if (resizeObserver.current) {
        try {
          if (mapContainer.current) {
            resizeObserver.current.unobserve(mapContainer.current)
          }
          resizeObserver.current.disconnect()
        } catch (error) {
          // Ignore ResizeObserver cleanup errors
          console.warn('ResizeObserver cleanup warning:', error)
        }
        resizeObserver.current = null
      }

      // Clean up map
      if (map.current) {
        try {
          // Check if map is still valid and not already removed
          if (map.current && 
              typeof map.current.remove === 'function' && 
              !map.current._removed) {
            // Additional safety check - ensure container exists and is in DOM
            const container = map.current.getContainer()
            if (container && container.parentNode) {
              // Check if the map is in a valid state before removing
              try {
                // Try to access a safe property to check if map is still valid
                if (map.current.getStyle && map.current.getStyle()) {
                  map.current.remove()
                }
              } catch (styleError) {
                // If we can't access style, the map might be in an invalid state
                console.warn('Map style check failed, skipping remove:', styleError)
              }
            }
          }
        } catch (error) {
          // Ignore cleanup errors - map might already be removed or in invalid state
          console.warn('Map cleanup warning:', error)
        } finally {
          map.current = null
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      // Clear existing markers using our ref
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove()
        }
      })
      markersRef.current = []

      // Add markers for properties with valid coordinates
      const validProperties = properties.filter((p): p is Property & { lat: number; lng: number } => 
        typeof p.lat === 'number' && 
        typeof p.lng === 'number' && 
        !isNaN(p.lat) && 
        !isNaN(p.lng)
      )

      validProperties.forEach(property => {
        const el = document.createElement('div')
        el.className = 'property-marker'
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        // Determine marker color: red if selected or hovered, blue otherwise
        const isSelected = selectedPropertyId === property.id
        const isHovered = hoveredPropertyId === property.id
        el.style.backgroundColor = (isSelected || isHovered) ? '#ef4444' : '#3b82f6'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        el.style.cursor = 'pointer'
        el.style.transition = 'all 0.2s ease'

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: true
        }).setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${property.title || 'Untitled Property'}</h3>
            <p class="text-xs text-gray-600">${property.address_line}, ${property.city}, ${property.state}</p>
            <p class="text-xs text-gray-600">${property.size_sqft?.toLocaleString()} sq ft</p>
            <p class="text-xs text-gray-600">$${property.base_rent_psf}/sq ft</p>
            <span class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 mt-1">
              ${property.phase.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        `)

        if (property.lat && property.lng) {
          const marker = new mapboxgl.Marker(el)
            .setLngLat([property.lng, property.lat])
            .setPopup(popup)
            .addTo(map.current!)

          // Store marker in ref for proper cleanup
          markersRef.current.push(marker)

          // Add click handler to marker
          el.addEventListener('click', (e) => {
            e.stopPropagation() // Prevent map click event from firing
            if (onPropertySelect) {
              onPropertySelect(property.id)
            }
          })
        }
      })

      // Fit map to show all markers with optimal zoom
      if (validProperties.length > 0) {
        if (validProperties.length === 1) {
          // For single property, center and zoom in
          map.current.setCenter([validProperties[0].lng, validProperties[0].lat])
          map.current.setZoom(15)
        } else {
          // For multiple properties, calculate bounds and fit to them
          const bounds = new mapboxgl.LngLatBounds()
          validProperties.forEach(property => {
            bounds.extend([property.lng, property.lat])
          })
          
          // Fit the map to the bounds with padding
          map.current.fitBounds(bounds, {
            padding: 50, // Add 50px padding around the bounds
            maxZoom: 15, // Don't zoom in too much
            duration: 1000 // Smooth transition
          })
        }
      }
    } catch (error) {
      console.warn('Error adding markers to map:', error)
    }
  }, [properties, mapLoaded, selectedPropertyId, hoveredPropertyId])

  // Handle territory polygon display
  useEffect(() => {
    if (!map.current || !mapLoaded || !territoryPolygon) return

    const sourceId = 'territory-polygon'
    const layerId = 'territory-polygon-fill'
    const outlineLayerId = 'territory-polygon-outline'

    try {
      // Remove existing territory polygon if it exists
      if (map.current.getSource(sourceId)) {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId)
        }
        if (map.current.getLayer(outlineLayerId)) {
          map.current.removeLayer(outlineLayerId)
        }
        map.current.removeSource(sourceId)
      }

      // Add territory polygon if showTerritory is true
      if (showTerritory) {
        // Add the GeoJSON source
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: territoryPolygon as mapboxgl.GeoJSONSourceRaw['data']
        })

        // Add the fill layer
        map.current.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.2
          }
        })

        // Add the outline layer
        map.current.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-opacity': 0.8
          }
        })
      }
    } catch (error) {
      console.warn('Error handling territory polygon:', error)
    }
  }, [mapLoaded, territoryPolygon, showTerritory])

  // Handle style changes when satellite view toggle changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !mapContainer.current) return

    const newStyle = isSatelliteView ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12'
    
    try {
      // Check if map is still valid before changing style
      if (map.current && !map.current._removed && mapContainer.current) {
        map.current.setStyle(newStyle)
      }
    } catch (error) {
      console.warn('Error changing map style:', error)
    }
  }, [isSatelliteView, mapLoaded])



  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
