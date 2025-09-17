'use client'

import { notFound } from 'next/navigation'
import React, { useState, useEffect } from 'react'
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
import { MapPin, Building2 } from 'lucide-react'



interface Market {
  id: string
  name: string
}



async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getMarket(id: string): Promise<Market | null> {
  const { data, error } = await supabase
    .from('markets')
    .select('id, name')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}



export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const [property, setProperty] = useState<Property | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params
        const propertyData = await getProperty(resolvedParams.id)
        
        if (!propertyData) {
          notFound()
        }
        
        const marketData = propertyData.market_id ? await getMarket(propertyData.market_id) : null
        
        setProperty(propertyData)
        setMarket(marketData)
      } catch (error) {
        console.error('Error loading property data:', error)
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderBottomColor: '#637484' }}></div>
              <p className="text-sm text-gray-600">Loading property...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!property) {
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
                  <BreadcrumbLink href="/properties">Properties</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{property.address_line || property.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{property.title || 'Untitled Property'}</h1>
              <p className="text-muted-foreground">Property Details</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={getPhaseVariant(property.phase)}>
                {getPhaseLabel(property.phase)}
              </Badge>
            </div>
          </div>

          {/* Property Information and Map Layout */}
          <div className="grid grid-cols-3 gap-6 h-[600px]">
            {/* Property Information - 1/3 width */}
            <div className="col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  {/* Property Image */}
                  {property.photo_url ? (
                    <div 
                      className="w-full h-56 rounded-lg overflow-hidden relative group cursor-pointer"
                      onClick={() => setEnlargedImage(property.photo_url!)}
                    >
                      <img 
                        src={property.photo_url} 
                        alt={property.title || 'Property image'} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          console.error('Image failed to load:', property.photo_url);
                          e.currentTarget.style.display = 'none';
                          // Show fallback
                          const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', property.photo_url);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Click to enlarge
                        </span>
                      </div>
                      <div className="image-fallback absolute inset-0 bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-center">
                          <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                          <span className="text-gray-400 text-sm">Image unavailable</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image available</span>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-sm">
                      {property.address_line && property.address_line}
                      {property.address_line && <br />}
                      {property.city}, {property.state} {property.postal_code}
                    </p>
                  </div>
                  {property.size_sqft && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Size</label>
                      <p className="text-sm">{property.size_sqft.toLocaleString()} sq ft</p>
                    </div>
                  )}
                  {property.base_rent_psf && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Base Rent</label>
                      <p className="text-sm">{formatCurrency(property.base_rent_psf)} per sq ft</p>
                    </div>
                  )}
                  {property.expenses_psf && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expenses</label>
                      <p className="text-sm">{formatCurrency(property.expenses_psf)} per sq ft</p>
                    </div>
                  )}

                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">About the Space</label>
                    <p className="text-xs text-muted-foreground">
                      Modern retail space with high ceilings, natural light, and flexible layout. 
                      Located in prime commercial district with excellent foot traffic.
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">About the Property</label>
                    <p className="text-xs text-muted-foreground">
                      Well-maintained building with updated HVAC, parking, and security. 
                      Zoned for commercial use with potential for expansion.
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documents</label>
                    <div className="text-xs space-y-1">
                      <a 
                        href="#" 
                        className="block text-foreground hover:text-muted-foreground"
                      >
                        📄 Lease Agreement.pdf
                      </a>
                      <a 
                        href="#" 
                        className="block text-foreground hover:text-muted-foreground"
                      >
                        📄 Property Survey.pdf
                      </a>
                      <a 
                        href="#" 
                        className="block text-foreground hover:text-muted-foreground"
                      >
                        📄 Floor Plan.pdf
                      </a>
                      <a 
                        href="#" 
                        className="block text-foreground hover:text-muted-foreground"
                      >
                        📄 Inspection Report.pdf
                      </a>
                    </div>
                  </div>
                  

                </CardContent>
              </Card>
            </div>

            {/* Property Map - 2/3 width */}
            <div className="col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Property Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <MarketMap 
                    properties={[property]} 
                    marketName={property.title || 'Property'}
                    className="h-full w-full rounded-b-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </div>


        </div>
      </SidebarInset>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100]"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[80vh] p-4">
            <img 
              src={enlargedImage} 
              alt="Enlarged property image" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button 
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                setEnlargedImage(null);
              }}
              title="Close enlarged view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}
