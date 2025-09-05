'use client'

import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Ensure Mapbox CSS is loaded
if (typeof window !== 'undefined') {
  console.log('Mapbox CSS loaded, mapboxgl version:', mapboxgl.version)
}
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Globe } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { Property, Market } from '@/lib/supabase'


// Set your Mapbox access token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapData {
  properties: Property[]
  markets: Market[]
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [lng, setLng] = useState(-100.5284) // Default longitude for US center
  const [lat, setLat] = useState(35.014)   // Default latitude for US center
  const [zoom, setZoom] = useState(1.46)   // Default zoom to show full globe
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapData, setMapData] = useState<MapData>({ properties: [], markets: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [properties, markets] = await Promise.all([
          DataService.getProperties(),
          DataService.getMarkets()
        ])

        console.log('School of Rock map data loaded:', { propertiesCount: properties.length, marketsCount: markets.length })
        setMapData({ properties, markets })
      } catch (error) {
        console.error('Error fetching map data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMapData()
  }, [])

  useEffect(() => {
    // Wait for map data to load and DOM to be ready
    if (loading || !mapContainer.current) {
      return
    }

    // Prevent multiple initializations
    if (map.current) {
      console.log('Map already exists, skipping initialization')
      return
    }

    console.log('Mapbox access token:', mapboxgl.accessToken)
    console.log('Token length:', mapboxgl.accessToken?.length)

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is not set. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.')
      return
    }

    if (mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
      console.error('Please replace the placeholder token with your actual Mapbox access token')
      return
    }

    const container = mapContainer.current
    if (!container) {
      console.error('Map container not found')
      return
    }

    console.log('Initializing map with container:', container)
    console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight)
    console.log('Map center:', [lng, lat], 'Zoom:', zoom)

    try {
      map.current = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v12', // Standard street style
        center: [lng, lat],
        zoom: zoom,
        preserveDrawingBuffer: true, // Prevent map from disappearing
        antialias: true, // Improve rendering quality
      })

      console.log('Map initialized successfully')
      
      // Add event listeners
      map.current.on('load', () => {
        console.log('Map loaded successfully')
        setMapLoaded(true)
        if (map.current) {
          map.current.resize()
          addMarkersToMap()
        }
      })

      map.current.on('move', () => {
        if (map.current) {
          setLng(parseFloat(map.current.getCenter().lng.toFixed(4)))
          setLat(parseFloat(map.current.getCenter().lat.toFixed(4)))
          setZoom(parseFloat(map.current.getZoom().toFixed(2)))
        }
      })

      map.current.on('error', (e) => {
        console.error('Map error:', e)
      })

      // Handle map resizing when the container changes size (e.g., sidebar collapse/expand)
      const resizeObserver = new ResizeObserver(() => {
        if (map.current && map.current.isStyleLoaded()) {
          console.log('Resizing map due to container change')
          map.current.resize()
        }
      })

      resizeObserver.observe(container)

      // Store the resize observer for cleanup
      const cleanup = () => {
        if (map.current) {
          console.log('Cleaning up map')
          map.current.remove()
          map.current = null
        }
        resizeObserver.unobserve(container)
        resizeObserver.disconnect()
      }

      // Cleanup function
      return cleanup
    } catch (error) {
      console.error('Error initializing map:', error)
      return
    }
  }, [loading]) // Add loading dependency to ensure DOM is ready

  // Re-add markers when map data changes
  useEffect(() => {
    if (mapLoaded && map.current && mapData.properties.length > 0) {
      addMarkersToMap()
    }
  }, [mapLoaded, mapData.properties.length])

  const addMarkersToMap = () => {
    if (!map.current || !mapLoaded) return

    console.log('Adding markers to map page:', mapData.properties.length, 'properties')
    console.log('Properties with coordinates:', mapData.properties.filter(p => p.lat && p.lng).length)

    // Add property markers
    mapData.properties.forEach((property) => {
      if (property.lat && property.lng && map.current) {
        // Create property marker
        const markerEl = document.createElement('div')
        markerEl.className = 'property-marker'
        markerEl.style.width = '20px'
        markerEl.style.height = '20px'
        markerEl.style.borderRadius = '50%'
        markerEl.style.backgroundColor = '#3b82f6'
        markerEl.style.border = '2px solid white'
        markerEl.style.cursor = 'pointer'
        markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

        // Create popup for property
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${property.title || property.address_line || 'Untitled Property'}</h3>
            <p class="text-xs text-gray-600">${property.city}, ${property.state}</p>
            ${property.base_rent_psf ? `<p class="text-xs text-gray-600">$${property.base_rent_psf}/sq ft</p>` : ''}
            <p class="text-xs text-gray-500">Phase: ${property.phase}</p>
          </div>
        `)

        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat([property.lng, property.lat])
          .setPopup(popup)
          .addTo(map.current)
      }
    })

    console.log(`Added ${mapData.properties.filter(p => p.lat && p.lng).length} property markers to the map`)
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading map data...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Map</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-col flex-1 min-h-0 p-4 pt-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Interactive Map</h1>
            </div>
          </div>
          

          
          <p className="text-muted-foreground mb-4">
            Explore properties, markets, and geographic data on an interactive map. Click on markers to view details.
          </p>
          
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-gray-50">
            <div ref={mapContainer} className="w-full h-full" />
            {(!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') && !mapLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Map Not Available</h3>
                  <p className="text-gray-600 mb-4">
                    {!mapboxgl.accessToken 
                      ? 'Mapbox access token is not configured.'
                      : 'Please set your Mapbox access token in .env.local'
                    }
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                    <p className="font-medium">Setup Required:</p>
                    <p>1. Get your token from <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="underline">Mapbox</a></p>
                    <p>2. Add to .env.local: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here</p>
                    <p>3. Restart the development server</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
