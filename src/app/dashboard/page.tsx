'use client'

import { useEffect, useState, useRef } from 'react'
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { DataService } from '@/lib/data-service'
import { Property, Market } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Globe } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Ensure Mapbox CSS is loaded
if (typeof window !== 'undefined') {
  console.log('Mapbox CSS loaded, mapboxgl version:', mapboxgl.version)
}

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface DashboardStats {
  totalMarkets: number
  totalProperties: number
  recentProperties: Property[]
  marketPropertyCounts: Array<{
    marketId: string
    propertyCount: number
  }>
}

interface DashboardData {
  stats: DashboardStats | null
  allProperties: Property[]
  markets: Market[]
}

interface MarketCenter {
  id: string
  name: string
  lat: number
  lng: number
  zoom: number
  propertyCount: number
}



export default function Page() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({ stats: null, allProperties: [], markets: [] })
  const [marketCenters, setMarketCenters] = useState<MarketCenter[]>([])
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardStats, allProperties, markets] = await Promise.all([
          DataService.getDashboardStats(),
          DataService.getProperties(),
          DataService.getMarkets()
        ])
        console.log('Dashboard stats loaded:', dashboardStats)
        console.log('All properties loaded:', allProperties.length)
        console.log('Markets loaded:', markets.length)
        setDashboardData({ stats: dashboardStats, allProperties, markets })
        
        // Calculate market centers based on properties
        const centers = await calculateMarketCenters(markets, allProperties)
        setMarketCenters(centers)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to calculate market centers based on properties
  const calculateMarketCenters = async (markets: Market[], allProperties: Property[]): Promise<MarketCenter[]> => {
    const centers: MarketCenter[] = []
    
    for (const market of markets) {
      const marketProperties = allProperties.filter(p => p.market_id === market.id)
      const validProperties = marketProperties.filter(p => 
        typeof p.lat === 'number' && 
        typeof p.lng === 'number' && 
        !isNaN(p.lat) && 
        !isNaN(p.lng)
      )
      
      if (validProperties.length > 0) {
        // Calculate center from valid properties
        const lat = validProperties.reduce((sum, p) => sum + p.lat!, 0) / validProperties.length
        const lng = validProperties.reduce((sum, p) => sum + p.lng!, 0) / validProperties.length
        
        // Adjust zoom based on number of valid properties
        let zoom = 10
        if (validProperties.length === 1) {
          zoom = 12
        } else if (validProperties.length <= 3) {
          zoom = 11
        }
        
        centers.push({
          id: market.id,
          name: market.name,
          lat,
          lng,
          zoom,
          propertyCount: validProperties.length
        })
      }
    }
    
    return centers
  }

  // Function to fly to a specific market
  const flyToMarket = (marketId: string) => {
    const market = marketCenters.find(m => m.id === marketId)
    if (market && map.current) {
      setSelectedMarket(marketId)
      map.current.flyTo({
        center: [market.lng, market.lat],
        zoom: market.zoom,
        duration: 2000,
        essential: true
      })
    }
  }

  // Function to reset view to show all markets
  const resetView = () => {
    if (map.current) {
      setSelectedMarket(null)
      map.current.flyTo({
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3.5, // Original zoom level
        duration: 2000,
        essential: true
      })
    }
  }

  useEffect(() => {
    // Wait for stats to load and DOM to be ready
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

    try {
      map.current = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v12', // Standard street style
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3.5, // Zoomed in on US
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

  // Add markers when stats data becomes available
  useEffect(() => {
    if (mapLoaded && dashboardData.allProperties && map.current) {
      addMarkersToMap()
    }
  }, [mapLoaded, dashboardData.allProperties])

  const addMarkersToMap = () => {
    if (!map.current || !mapLoaded || !dashboardData.allProperties) {
      console.log('addMarkersToMap early return:', {
        hasMap: !!map.current,
        mapLoaded,
        hasStats: !!dashboardData.stats,
        hasAllProperties: !!dashboardData.allProperties,
        allPropertiesCount: dashboardData.allProperties?.length
      })
      return
    }

    console.log('Adding markers to dashboard map:', dashboardData.allProperties.length, 'properties')
    console.log('Properties with coordinates:', dashboardData.allProperties.filter(p => p.lat && p.lng).length)
    
    // Add property markers
    dashboardData.allProperties.forEach((property) => {
      if (property.lat && property.lng && map.current) {
        // Create property marker
        const markerEl = document.createElement('div')
        markerEl.className = 'property-marker'
        markerEl.style.width = '16px'
        markerEl.style.height = '16px'
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

    console.log(`Added ${dashboardData.allProperties.filter(p => p.lat && p.lng).length} property markers to the map`)
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Markets</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats?.totalMarkets || 0}</div>
                <p className="text-xs text-muted-foreground">Active markets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats?.totalProperties || 0}</div>
                <p className="text-xs text-muted-foreground">Properties across all markets</p>
              </CardContent>
            </Card>
          </div>



          {/* Mapbox Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Overview
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={selectedMarket === null ? "default" : "outline"}
                  size="sm"
                  onClick={resetView}
                  className="h-8 text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Show All
                </Button>
                {marketCenters.map((market) => (
                  <Button
                    key={market.id}
                    variant={selectedMarket === market.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => flyToMarket(market.id)}
                    className="h-8 text-xs"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {market.name}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {market.propertyCount}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-gray-50">
                <div ref={mapContainer} className="w-full h-96" />
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
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
