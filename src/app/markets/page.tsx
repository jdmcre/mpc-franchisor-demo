'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
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
import { Market, MarketUpdate, supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, User, Users, MessageSquare, Edit, Trash2, X, Filter } from 'lucide-react'
import { ViewToggle } from '@/components/view-toggle'
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from './columns'
import { MarketUpdateForm } from '@/components/market-update-form'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [marketDetailsModalOpen, setMarketDetailsModalOpen] = useState(false)
  const marketDetailsTriggerRef = useRef<HTMLButtonElement>(null)

  const handleViewUpdates = (marketId: string) => {
    const market = markets.find(m => m.id === marketId)
    if (market) {
      setSelectedMarketForUpdates(market)
      setUpdatesModalOpen(true)
    }
  }

  const handleMarketRowClick = (market: MarketWithDetails) => {
    router.push(`/markets/${market.id}`)
  }

  const handleViewMarketDetails = () => {
    setMarketDetailsModalOpen(true)
  }

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

  // Filter markets based on selected phase
  const filteredMarkets = useMemo(() => {
    if (phaseFilter === 'all') {
      return markets
    }
    return markets.filter(market => 
      market.phases.some(phase => 
        phase && phase.toLowerCase().trim() === phaseFilter.toLowerCase().trim()
      )
    )
  }, [markets, phaseFilter])

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

  // Close Market Details modal when Updates modal closes
  useEffect(() => {
    if (!updatesModalOpen && marketDetailsModalOpen) {
      setMarketDetailsModalOpen(false)
    }
  }, [updatesModalOpen, marketDetailsModalOpen])

  // Focus management and keyboard handling for Market Details modal
  useEffect(() => {
    if (marketDetailsModalOpen) {
      // Focus trap and keyboard handling
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMarketDetailsModalOpen(false)
        }
      }


      // Add event listener
      document.addEventListener('keydown', handleKeyDown)

      // Focus the modal after a brief delay to ensure it's rendered
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement
        if (modal) {
          modal.focus()
        }
      }, 100)

      // Cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        // Restore focus to the trigger button when modal closes
        if (marketDetailsTriggerRef.current) {
          marketDetailsTriggerRef.current.focus()
        }
      }
    }
  }, [marketDetailsModalOpen])




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
              {/* Phase Filter */}
              <div className="flex items-center gap-4 mb-6">
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
                          
                          {/* Action Button */}
                          <div className="pt-1 flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/markets/${market.id}`)
                              }}
                            >
                              View Details
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

        {/* Market Updates Modal - Base Sheet (~20% width) */}
        <Sheet
          modal={false}
          open={updatesModalOpen}
          onOpenChange={(next) => {
            if (!next && marketDetailsModalOpen) return; // don't close base while details is open
            setUpdatesModalOpen(next);
          }}
        >
          <SheetContent side="right" className="w-[20vw] min-w-[300px] z-[60]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Market Updates
              </SheetTitle>
              <SheetDescription>
                {selectedMarketForUpdates?.name || 'Market'}
              </SheetDescription>
              <div className="pt-2">
                <Button
                  ref={marketDetailsTriggerRef}
                  variant="link"
                  onClick={handleViewMarketDetails}
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                >
                  View Market Details
                </Button>
              </div>
            </SheetHeader>

            {/* Independent scroll area for Market Updates */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMarketForUpdates && (() => {
                const filteredUpdates = marketUpdates.filter(msg => msg.market_id === selectedMarketForUpdates.id)
                return filteredUpdates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                    <p className="font-medium">No updates yet</p>
                    <p className="text-sm mt-1">Start a conversation for this market</p>
                  </div>
                ) : (
                  filteredUpdates.map((message) => {
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
                  })
                )
              })()}
            </div>
          </SheetContent>
        </Sheet>

        {/* Market Details Modal - Portal-based to avoid stacking context issues */}
        {marketDetailsModalOpen && typeof window !== 'undefined' && createPortal(
          <>
            {/* Invisible backdrop for clicks */}
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setMarketDetailsModalOpen(false)}
            />
            {/* Modal content */}
            <div
              className="fixed top-0 bottom-0 bg-white border-r shadow-lg transition-all duration-300 flex flex-col outline-none z-[101]"
              style={{
                width: '50vw',
                right: '20vw', // Position from left edge of Market Updates
                left: 'auto'
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="market-details-title"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center gap-4 border-b px-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <h2 id="market-details-title" className="text-lg font-semibold">Market Details</h2>
                </div>
                <button
                  onClick={() => setMarketDetailsModalOpen(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="ml-auto p-2 hover:bg-gray-100 rounded-md"
                  aria-label="Close Market Details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-2 text-sm text-muted-foreground border-b">
                {selectedMarketForUpdates?.name || 'Market'} - Detailed information and location
              </div>

              {/* Independent scroll area for Market Details */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Map Placeholder */}
                <div className="w-full h-full bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center min-h-[500px]">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">Map placeholder for {selectedMarketForUpdates?.name}</p>
                    <p className="text-sm text-gray-400">Interactive map would be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}


      </SidebarInset>
    </SidebarProvider>
  )
}