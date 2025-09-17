'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
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
import { Market, MarketUpdate, Property, supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, User, Users, MessageSquare, Edit, Trash2, X, Filter } from 'lucide-react'
import { ViewToggle } from '@/components/view-toggle'
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from './columns'
import { MarketUpdateForm } from '@/components/market-update-form'
import { MarketMap } from '@/components/market-map'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface MarketWithDetails extends Market {
  propertyCount: number
  phases: string[]
  franchisees: Array<{
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    status: string | null
  }>
}

// Remove the old ChatMessage interface since we'll use MarketUpdate from Supabase

export default function MarketsPage() {
  const router = useRouter()
  const [markets, setMarkets] = useState<MarketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'cards' | 'table'>('table')
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false)
  const [selectedMarketForUpdates, setSelectedMarketForUpdates] = useState<MarketWithDetails | null>(null)
  const [marketUpdates, setMarketUpdates] = useState<MarketUpdate[]>([])
  const [editingUpdate, setEditingUpdate] = useState<MarketUpdate | null>(null)
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [marketProperties, setMarketProperties] = useState<Property[]>([])
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null)
  const marketDetailsTriggerRef = useRef<HTMLButtonElement>(null)

  const handleViewUpdates = useCallback(async (marketId: string) => {
    const market = markets.find(m => m.id === marketId)
    if (market) {
      setSelectedMarketForUpdates(market)
      setUpdatesModalOpen(true)
      setShowDetails(false)
      
      // Fetch properties for this market
      try {
        const properties = await DataService.getPropertiesByMarket(marketId)
        setMarketProperties(properties)
      } catch (error) {
        console.error('Error fetching market properties:', error)
        setMarketProperties([])
      }
    }
  }, [markets])

  const handleMarketRowClick = (market: MarketWithDetails) => {
    // Navigate to market details page
    router.push(`/markets/${market.id}`)
  }

  const handleViewMarketDetails = useCallback(() => {
    setShowDetails(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setUpdatesModalOpen(false)
    setShowDetails(false)
    setHighlightedPropertyId(null)
  }, [])

  const handlePropertyClick = useCallback((propertyId: string) => {
    setHighlightedPropertyId(propertyId || null)
  }, [])

  // Define all possible phases for the filter dropdown in specific order
  const allPhases = useMemo(() => {
    const standardPhases = ['intro', 'site_selection', 'loi', 'lease', 'closed']
    const marketPhases = new Set<string>()
    
    // Collect unique phases from markets, normalizing case
    markets.forEach(market => {
      market.phases.forEach(phase => {
        if (phase && phase.trim()) {
          marketPhases.add(phase.toLowerCase().trim())
        }
      })
    })
    
    // Combine standard phases with any additional phases found in markets
    // Use Set to ensure no duplicates
    const allUniquePhases = new Set([...standardPhases, ...Array.from(marketPhases)])
    
    // Sort phases according to the specific order requested
    const phaseOrder = ['intro', 'site_selection', 'loi', 'lease', 'closed']
    return Array.from(allUniquePhases).sort((a, b) => {
      const indexA = phaseOrder.indexOf(a)
      const indexB = phaseOrder.indexOf(b)
      
      // If both phases are in the predefined order, sort by that order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      
      // If only one is in the predefined order, prioritize it
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      
      // If neither is in the predefined order, sort alphabetically
      return a.localeCompare(b)
    })
  }, [markets])

  // Function to normalize phase display text
  const normalizePhaseText = (phase: string): string => {
    if (!phase) return phase
    
    // Handle special case for LOI
    if (phase.toLowerCase() === 'loi') {
      return 'LOI'
    }
    
    // Replace underscores with spaces and capitalize each word
    return phase
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Filter markets based on selected phase and search term
  const filteredMarkets = useMemo(() => {
    let filtered = markets

    // Apply phase filter
    if (phaseFilter !== 'all') {
      filtered = filtered.filter(market => 
        market.phases.some(phase => 
          phase && phase.toLowerCase().trim() === phaseFilter.toLowerCase().trim()
        )
      )
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(market =>
        market.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    }

    return filtered
  }, [markets, phaseFilter, searchTerm])

  const fetchMarketUpdates = async () => {
    try {
      const updates = await DataService.getMarketUpdates()
      setMarketUpdates(updates)
    } catch (error) {
      console.error('Error fetching market updates:', error)
    }
  }

  const handleUpdateMarketUpdates = () => {
    // No need to manually fetch - realtime will handle updates
    // Just clear the form state
  }

  const handleEditUpdate = (update: MarketUpdate) => {
    setEditingUpdate(update)
  }

  const handleCancelEdit = () => {
    setEditingUpdate(null)
  }

  const handleDeleteUpdate = async (updateId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await DataService.deleteMarketUpdate(updateId)
        // The realtime subscription will handle the UI update
      } catch (error) {
        console.error('Error deleting market update:', error)
      }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketsWithDetails] = await Promise.all([
          DataService.getMarketsWithDetails(),
          fetchMarketUpdates()
        ])
        setMarkets(marketsWithDetails)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Reset details view when panel closes
  useEffect(() => {
    if (!updatesModalOpen) {
      setShowDetails(false)
    }
  }, [updatesModalOpen])




  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading markets...</div>
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
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Markets</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4 flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>All Markets</CardTitle>
              <CardDescription>
                {filteredMarkets.length} markets in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter by Phase:</span>
                  </div>
                  <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Phases</SelectItem>
                      {allPhases.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {normalizePhaseText(phase)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search markets by name..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {view === 'cards' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMarkets.map((market) => (
                      <Card 
                        key={market.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleMarketRowClick(market)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{market.name}</CardTitle>
                            {/* Phase Tag */}
                            {market.phases.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {normalizePhaseText(market.phases[0])}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {/* Properties Count */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{market.propertyCount} properties</span>
                          </div>
                          
                          {/* Franchisees Section */}
                          {market.franchisees.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Users className="h-4 w-4" />
                                <span>Franchisee</span>
                              </div>
                              <div className="space-y-1">
                                {market.franchisees.map((franchisee) => {
                                  // Generate initials from full name
                                  const getInitials = (name: string | null) => {
                                    if (!name) return 'U'
                                    return name
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase())
                                      .join('')
                                      .slice(0, 2)
                                  }
                                  
                                  return (
                                    <div key={franchisee.id} className="flex items-center gap-2 p-1">
                                      <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                          <span className="text-xs font-medium text-blue-700">
                                            {getInitials(franchisee.full_name)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {franchisee.full_name || 'Unnamed Franchisee'}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* View Updates Button */}
                          <div className="pt-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewUpdates(market.id)
                              }}
                              className="text-xs"
                            >
                              View Updates
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {filteredMarkets.length === 0 && (
                    <div className="text-center py-12">
                      <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No markets found</h3>
                      <p className="mt-2 text-muted-foreground">
                        {phaseFilter === 'all' 
                          ? 'No markets available.' 
                          : `No markets found with phase "${phaseFilter}".`
                        }
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <DataTable 
                  columns={createColumns(handleViewUpdates)} 
                  data={filteredMarkets} 
                  searchKey="name"
                  searchPlaceholder="Filter markets by name..."
                  onRowClick={handleMarketRowClick}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Single Expandable Market Panel */}
        <Sheet
          modal={false}
          open={updatesModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleClosePanel()
            }
          }}
        >
          <SheetContent 
            side="right" 
            className={`transition-all duration-300 ${
              showDetails 
                ? 'w-[70vw] min-w-[800px]' 
                : 'w-[35vw] min-w-[400px]'
            } z-[60]`}
          >
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <SheetTitle>Market Updates</SheetTitle>
                  {showDetails && (
                    <>
                      <div className="mx-2 text-muted-foreground">•</div>
                      <Building2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Market Details</span>
                    </>
                  )}
                </div>
              </div>
              <SheetDescription>
                {selectedMarketForUpdates?.name || 'Market'}
                {showDetails && ' - Updates and detailed information'}
              </SheetDescription>
            </SheetHeader>

            {/* Content Area - Side by Side when details are shown */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className={`flex gap-6 h-full ${showDetails ? 'flex-row' : 'flex-col'}`}>
                {/* Details Section - Shows on the LEFT when expanded */}
                {showDetails && (
                  <div className="w-1/2 pl-2">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-600">Market Details</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(false)}
                        className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Hide Details
                      </Button>
                    </div>
                    
                    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {/* Map Section */}
                      <div className="w-full h-64 mb-4">
                        <MarketMap 
                          properties={marketProperties}
                          marketName={selectedMarketForUpdates?.name || 'Market'}
                          highlightedPropertyId={highlightedPropertyId}
                          propertyNumbers={marketProperties.reduce((acc, property, index) => {
                            acc[property.id] = index + 1
                            return acc
                          }, {} as Record<string, number>)}
                          onPropertyClick={handlePropertyClick}
                          className="w-full h-full"
                        />
                      </div>

                      {/* Properties Table */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">Properties ({marketProperties.length})</h4>
                        {marketProperties.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-xs">
                            No properties found
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {marketProperties.map((property, index) => {
                              const isHighlighted = highlightedPropertyId === property.id
                              const hasRentData = (property.base_rent_psf || 0) > 0 || (property.expenses_psf || 0) > 0
                              
                              return (
                                <div 
                                  key={property.id} 
                                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                                    isHighlighted 
                                      ? 'bg-blue-100 border-2 border-blue-300' 
                                      : 'bg-gray-50 hover:bg-gray-100'
                                  }`}
                                  onClick={() => setHighlightedPropertyId(property.id)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {/* Property Number Badge */}
                                    <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">
                                        {property.title || property.address_line || 'Untitled Property'}
                                      </div>
                                      <div className="text-gray-500 truncate">
                                        {[property.city, property.state].filter(Boolean).join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {property.size_sqft && (
                                      <span className="text-gray-600">
                                        {property.size_sqft.toLocaleString()} SF
                                      </span>
                                    )}
                                    {hasRentData && (
                                      <span className="text-gray-600 font-medium text-right">
                                        <div className="text-xs">
                                          ${(property.base_rent_psf || 0).toFixed(2)} + ${(property.expenses_psf || 0).toFixed(2)}/SF
                                        </div>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Updates Section */}
                <div className={`${showDetails ? 'w-1/2' : 'w-full'} ${showDetails ? 'border-l pl-6' : ''} relative`}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-600">Updates</h3>
                    </div>
                    {!showDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewMarketDetails}
                        className="h-7 px-3 text-xs"
                        disabled={!selectedMarketForUpdates}
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Show Details
                      </Button>
                    )}
                  </div>
                  {selectedMarketForUpdates && (() => {
                    const filteredUpdates = marketUpdates.filter(msg => msg.market_id === selectedMarketForUpdates.id)
                    return filteredUpdates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                        <p className="font-medium">No updates yet</p>
                        <p className="text-sm mt-1">Start a conversation for this market</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {filteredUpdates.map((message) => {
                          const isOrgAdmins = message.author === 'Org Admins'

                          return (
                            <div key={message.id} className="group transition-all duration-500">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  isOrgAdmins ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {isOrgAdmins ? 'OA' : 'MP'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {message.author}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(message.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {message.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

              </div>
            </div>
          </SheetContent>
        </Sheet>


      </SidebarInset>
    </SidebarProvider>
  )
}