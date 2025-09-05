'use client'

import { notFound } from 'next/navigation'
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { MarketMap } from '@/components/market-map'
import { supabase, Property } from '@/lib/supabase'
import { MapPin, Building2, DollarSign, ThumbsUp, ThumbsDown, Filter, Calendar, FileText, Download } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data
}

export default function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalProperty, setModalProperty] = useState<Property | null>(null)

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

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
  }

  const handleViewDetails = (property: Property) => {
    setModalProperty(property)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalProperty(null)
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
            <Badge variant="outline" className="text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {filteredProperties.length} Properties
              {selectedPhase !== 'all' && ` (${properties.length} total)`}
            </Badge>
          </div>

          {/* Map and Properties Layout - Fixed height, no scrolling */}
          {properties.length > 0 ? (
            <div className="flex-1 grid grid-cols-3 gap-6 p-4 md:p-6 min-h-0">
              {/* Properties List - 1/3 width */}
              <div className="col-span-1 min-h-0">
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
                    <div className="space-y-3">
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map((property) => (
                        <div 
                          key={property.id} 
                          className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                            selectedPropertyId === property.id 
                              ? 'ring-2 ring-blue-500/20 border-blue-200 bg-blue-50/30' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleViewDetails(property)}
                        >
                          <div className="p-5">
                            {/* Header with title and badge */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg text-gray-900 truncate">
                                  <a 
                                    href={`/properties/${property.id}`}
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {property.title || property.address_line || 'Untitled Property'}
                                  </a>
                                </h3>
                              </div>
                              <Badge 
                                variant={getPhaseVariant(property.phase)}
                                className="ml-2 shrink-0 text-xs font-medium"
                              >
                                {getPhaseLabel(property.phase)}
                              </Badge>
                            </div>
                            
                            {/* Property details */}
                            <div className="space-y-2.5 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">
                                  {property.address_line && `${property.address_line}, `}
                                  {property.city}, {property.state} {property.postal_code}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span>{formatNumber(property.size_sqft || 0)} sq ft</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span>
                                  {formatCurrency(property.base_rent_psf || 0)}/sq ft
                                  {property.expenses_psf && ` + ${formatCurrency(property.expenses_psf)} expenses`}
                                </span>
                              </div>
                            </div>

                            {/* Ranking section */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 font-medium">Ranking:</span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    className="p-1 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </button>
                                  <span className="text-xs text-gray-500 mx-1">0</span>
                                  <button 
                                    className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ThumbsDown className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400">
                                Click to view details
                              </div>
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

              {/* Market Map - 2/3 width */}
              <div className="col-span-2 min-h-0">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Market Location Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 min-h-0">
                    <MarketMap 
                      properties={filteredProperties} 
                      marketName={market.name}
                      className="h-full w-full rounded-b-lg"
                      selectedPropertyId={selectedPropertyId || undefined}
                      onPropertySelect={handlePropertySelect}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
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
                  <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-center">
                      <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                      <span className="text-gray-400 text-xs">Property Image</span>
                    </div>
                  </div>

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
                        <span>{formatCurrency(modalProperty.base_rent_psf)}/sq ft</span>
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

                {/* About Space */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">ABOUT SPACE</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">Modern retail space with high ceilings and natural light</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">Flexible layout perfect for various business types</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">Located in prime commercial district with excellent foot traffic</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">Easy access to major transportation routes</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Lease Agreement.pdf</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Property Survey.pdf</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Floor Plan.pdf</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Inspection Report.pdf</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
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
    </div>
  )
}
