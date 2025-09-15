'use client'

import { notFound } from 'next/navigation'
import React, { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { DataService } from '@/lib/data-service'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { MarketMap } from '@/components/market-map'
import { supabase, Property } from '@/lib/supabase'
import { MapPin, Building2, DollarSign, ThumbsUp, ThumbsDown, Filter, Calendar, FileText, Download, X, File, Layout, Satellite, Map } from 'lucide-react'
import { MapListToggle } from '@/components/map-list-toggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/data-table'
import { createPropertyColumns } from '../columns'

interface Market {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  client_id: string | null
}

interface Client {
  id: string
  name: string
}



async function getMarket(id: string): Promise<Market | null> {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getMarketProperties(marketId: string): Promise<Property[]> {
  return await DataService.getPropertiesByMarket(marketId)
}

export default function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
  const [isSatelliteView, setIsSatelliteView] = useState(false)
  const [market, setMarket] = useState<Market | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalProperty, setModalProperty] = useState<Property | null>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [view, setView] = useState<'map' | 'list'>('map')
  const propertiesListRef = useRef<HTMLDivElement>(null)

  // Get unique phases from properties
  const availablePhases = useMemo(() => {
    const phases = [...new Set(properties.map(p => p.phase))].sort()
    return phases
  }, [properties])

  // Filter properties based on selected phase
  const filteredProperties = useMemo(() => {
    if (selectedPhase === 'all') {
      return properties
    }
    return properties.filter(property => property.phase === selectedPhase)
  }, [properties, selectedPhase])

  // Load data on component mount
  React.useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params
        const marketData = await getMarket(resolvedParams.id)
        
        if (!marketData) {
          notFound()
        }
        
        const propertiesData = await getMarketProperties(marketData.id)
        
        setMarket(marketData)
        setProperties(propertiesData)
      } catch (error) {
        console.error('Error loading market data:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [params])

  // Set up realtime subscription for properties changes
  React.useEffect(() => {
    if (!market?.id) return

    const channel = supabase
      .channel(`properties-${market.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `market_id=eq.${market.id}`
        },
        async (payload) => {
          console.log('Property change detected:', payload)
          
          try {
            setIsUpdating(true)
            
            // Refresh properties data when changes occur
            const updatedProperties = await getMarketProperties(market.id)
            setProperties(updatedProperties)
            
            // If a property was deleted and it was selected, clear selection
            if (payload.eventType === 'DELETE' && selectedPropertyId === (payload as { old_record?: { id: string } }).old_record?.id) {
              setSelectedPropertyId(null)
            }
          } catch (error) {
            console.error('Error handling property change:', error)
          } finally {
            setIsUpdating(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [market?.id, selectedPropertyId])

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading market...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!market) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'site_selection': return 'Site Selection'
      case 'under_contract': return 'Under Contract'
      case 'due_diligence': return 'Due Diligence'
      case 'closing': return 'Closing'
      case 'closed': return 'Closed'
      case 'owned': return 'Owned'
      case 'leased': return 'Leased'
      case 'sold': return 'Sold'
      default: return phase
    }
  }

  const getPhaseVariant = (phase: string) => {
    switch (phase) {
      case 'site_selection': return 'outline'
      case 'under_contract': return 'secondary'
      case 'due_diligence': return 'default'
      case 'closing': return 'default'
      case 'closed': return 'secondary'
      case 'owned': return 'default'
      case 'leased': return 'outline'
      case 'sold': return 'secondary'
      default: return 'default'
    }
  }

  const scrollToProperty = (propertyId: string) => {
    if (propertiesListRef.current) {
      const propertyElement = propertiesListRef.current.querySelector(`[data-property-id="${propertyId}"]`)
      if (propertyElement) {
        propertyElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }
  }

  const handlePropertySelect = (propertyId: string) => {
    if (propertyId === '') {
      // Clear selection when clicking on empty map area
      setSelectedPropertyId(null)
    } else {
      setSelectedPropertyId(propertyId)
      scrollToProperty(propertyId)
    }
  }

  const handleViewDetails = (property: Property) => {
    setModalProperty(property)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalProperty(null)
    // Don't clear selectedPropertyId here - let it persist for map highlighting
  }

  const handlePdfClick = (url: string) => {
    setPdfUrl(url)
    setPdfModalOpen(true)
  }

  const closePdfModal = () => {
    setPdfModalOpen(false)
    setPdfUrl(null)
  }

  // Clear filter
  const clearFilter = () => {
    setSelectedPhase('all')
  }

  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-screen flex flex-col">
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
                    <BreadcrumbLink href="/markets">Markets</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{market.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{market.name}</h1>
              <p className="text-muted-foreground">Market Overview</p>
            </div>
            <div className="flex items-center gap-4">
              <MapListToggle view={view} onViewChange={setView} />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  {filteredProperties.length} Properties
                  {selectedPhase !== 'all' && ` (${properties.length} total)`}
                </Badge>
                {isUpdating && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                    Updating...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {properties.length > 0 ? (
            view === 'map' ? (
              /* Map View Layout */
              <div className="flex-1 flex gap-6 p-4 md:p-6 min-h-0">
                {/* Properties List - Dynamic width with minimum */}
                <div className="w-auto min-w-80 flex-shrink-0 min-h-0">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Property Locations
                        </CardTitle>
                        {selectedPhase !== 'all' && (
                          <button
                            onClick={clearFilter}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <X className="h-3 w-3" />
                            Clear filter
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by phase" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Phases ({properties.length})</SelectItem>
                            {availablePhases.map(phase => {
                              const count = properties.filter(p => p.phase === phase).length
                              return (
                                <SelectItem key={phase} value={phase}>
                                  {getPhaseLabel(phase)} ({count})
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto min-h-0">
                      <div ref={propertiesListRef} className="space-y-3">
                        {filteredProperties.length > 0 ? (
                          filteredProperties.map((property) => (
                          <div
                            key={property.id}
                            data-property-id={property.id}
                            className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-28 ${
                              selectedPropertyId === property.id 
                                ? 'ring-2 ring-blue-500/20 border-blue-200 bg-blue-50/30' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleViewDetails(property)}
                            onMouseEnter={() => setHoveredPropertyId(property.id)}
                            onMouseLeave={() => setHoveredPropertyId(null)}
                          >
                            {/* Horizontal Layout: Image Left, Details Right */}
                            <div className="flex h-full">
                              {/* Property Image - Left Side */}
                              <div className="relative w-36 h-28 flex-shrink-0">
                                {property.photo_url ? (
                                  <img 
                                    src={property.photo_url} 
                                    alt={property.title || property.address_line || 'Property image'} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <Building2 className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                
                              </div>

                              {/* Property Details - Right Side */}
                              <div className="flex-1 p-3 min-w-0 flex flex-col justify-center">
                                {/* Title (or address_line if title is empty) */}
                                <h3 className="font-semibold text-sm text-gray-900 mb-0.5 whitespace-nowrap">
                                  {property.title || property.address_line || 'Untitled Property'}
                                </h3>
                                
                                {/* Address line - only show if title exists */}
                                {property.title && (
                                  <p className="text-xs text-gray-600 mb-0.5 whitespace-nowrap">
                                    {property.address_line || ''}
                                  </p>
                                )}
                                
                                {/* City, State, Postal Code */}
                                <p className="text-xs text-gray-600 mb-0.5 whitespace-nowrap">
                                  {property.city}, {property.state} {property.postal_code ? property.postal_code.substring(0, 5) : ''}
                                </p>
                                
                                {/* Size in square feet */}
                                <p className="text-xs text-gray-600 mb-0.5 whitespace-nowrap">
                                  {formatNumber(property.size_sqft || 0)} SF
                                </p>
                                
                                {/* Base rent + expenses */}
                                <p className="text-xs font-medium text-gray-900 whitespace-nowrap">
                                  {formatCurrency(property.base_rent_psf || 0)}/SF
                                  {property.expenses_psf && ` + ${formatCurrency(property.expenses_psf)}/SF`}
                                </p>
                              </div>
                            </div>
                            
                            {/* Selection indicator */}
                            {selectedPropertyId === property.id && (
                              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            )}
                          </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No properties found for this phase</p>
                            <button
                              onClick={clearFilter}
                              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                            >
                              Clear filter to see all properties
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Market Map - Flexible width */}
                <div className="flex-1 min-h-0">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Market Location Map
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSatelliteView(!isSatelliteView)}
                          className="flex items-center gap-2"
                        >
                          {isSatelliteView ? (
                            <>
                              <Map className="h-4 w-4" />
                              Street
                            </>
                          ) : (
                            <>
                              <Satellite className="h-4 w-4" />
                              Satellite
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 min-h-0">
                      <MarketMap 
                        properties={filteredProperties} 
                        marketName={market.name}
                        className="h-full w-full rounded-b-lg"
                        selectedPropertyId={selectedPropertyId || undefined}
                        hoveredPropertyId={hoveredPropertyId || undefined}
                        isSatelliteView={isSatelliteView}
                        onPropertySelect={handlePropertySelect}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* List View Layout */
              <div className="flex-1 p-4 md:p-6 min-h-0">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Properties List
                      </CardTitle>
                      {selectedPhase !== 'all' && (
                        <button
                          onClick={clearFilter}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Clear filter
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Filter by phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Phases ({properties.length})</SelectItem>
                          {availablePhases.map(phase => {
                            const count = properties.filter(p => p.phase === phase).length
                            return (
                              <SelectItem key={phase} value={phase}>
                                {getPhaseLabel(phase)} ({count})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                      <DataTable 
                        columns={createPropertyColumns(handleViewDetails)} 
                        data={filteredProperties} 
                        searchKey="title"
                        searchPlaceholder="Search properties..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 md:p-6">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
                  <p className="text-muted-foreground text-center">
                    This market doesn&apos;t have any properties yet.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Property Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {modalProperty ? `Property Details - ${modalProperty.title || modalProperty.address_line || 'Untitled Property'}` : 'Property Details'}
            </DialogTitle>
          </DialogHeader>
          
          {modalProperty && (
            <div className="flex h-full">
              {/* Left Column - Property Details */}
              <div className="w-1/2 p-6 space-y-6 overflow-y-auto">
                {/* Top Row - Property Image and Property Info side by side */}
                <div className="flex gap-4">
                  {/* Property Image */}
                  {modalProperty.photo_url ? (
                    <div className="w-36 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img 
                        src={modalProperty.photo_url} 
                        alt={modalProperty.title || modalProperty.address_line || 'Property image'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="text-center">
                        <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    </div>
                  )}

                  {/* Property Info */}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {modalProperty.title || modalProperty.address_line || 'Untitled Property'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {modalProperty.address_line && `${modalProperty.address_line}, `}
                        {modalProperty.city}, {modalProperty.state} {modalProperty.postal_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {modalProperty.size_sqft && (
                        <span>{formatNumber(modalProperty.size_sqft)} sq ft</span>
                      )}
                      {modalProperty.base_rent_psf && (
                        <span>
                          {formatCurrency(modalProperty.base_rent_psf)}/sq ft
                          {modalProperty.expenses_psf && ` + ${formatCurrency(modalProperty.expenses_psf)} expenses`}
                        </span>
                      )}
                    </div>
                    <Badge 
                      variant={getPhaseVariant(modalProperty.phase)}
                      className="text-xs font-medium"
                    >
                      {getPhaseLabel(modalProperty.phase)}
                    </Badge>
                  </div>
                </div>

                {/* Marketing Material */}
                <div>
                  <div className="space-y-2">
                    <div 
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      onClick={() => handlePdfClick('https://www.venturedfw.com/files/listings/2124/Abilene%20-%20Former%20Popeyes%20-%20841%20Ambler%20Ave.pdf')}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Marketing Material</span>
                    </div>
                    <p className="text-xs text-gray-500 italic">*sample pdf for demo purposes</p>
                  </div>
                </div>

                {/* About Space */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">ABOUT SPACE</h3>
                  <div className="space-y-3">
                    {modalProperty.notes ? (
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {modalProperty.notes}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No additional information available for this space.
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Space Docs */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Space Docs</h4>
                      <div className="space-y-1">
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Layout className="h-4 w-4" />
                          <span>Floor Plan.pdf</span>
                        </a>
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <File className="h-4 w-4" />
                          <span>CAD Drawing.dwg</span>
                        </a>
                      </div>
                    </div>

                    {/* Demographics */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Demographics</h4>
                      <div className="space-y-1">
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Market Analysis.pdf</span>
                        </a>
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Population Data.pdf</span>
                        </a>
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Traffic Study.pdf</span>
                        </a>
                      </div>
                    </div>

                    {/* Deal Docs */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Deal Docs</h4>
                      <div className="space-y-1">
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Lease Agreement.pdf</span>
                        </a>
                        <a 
                          href="#" 
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <FileText className="h-4 w-4" />
                          <span>LOI Template.pdf</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Mapbox Map */}
              <div className="w-1/2 border-l border-gray-200">
                <div className="h-full">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Location Map</h3>
                  </div>
                  <div className="h-full">
                    <MarketMap 
                      properties={[modalProperty]} 
                      marketName={market?.name || ''}
                      className="h-full w-full"
                      selectedPropertyId={modalProperty.id}
                      onPropertySelect={() => {}}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Modal */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Marketing Material</DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4">
            {pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-[70vh] border-0 rounded-lg"
                title="Marketing Material PDF"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
