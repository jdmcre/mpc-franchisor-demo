'use client'

import { useEffect, useState } from 'react'
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
import { Property } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, DollarSign, Eye } from 'lucide-react'
import { ViewToggle } from '@/components/view-toggle'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await DataService.getProperties()
        setProperties(data)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])



  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading properties...</div>
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
                  <BreadcrumbPage>Properties</BreadcrumbPage>
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
              <CardTitle>All Properties</CardTitle>
              <CardDescription>
                {properties.length} properties in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {view === 'cards' ? (
                <>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map((property) => (
                      <Card key={property.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {property.title || property.address_line || 'Untitled Property'}
                            </CardTitle>
                            <Badge variant="secondary">{property.phase}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {property.city}, {property.state} {property.postal_code}
                            </span>
                          </div>
                          
                          {property.size_sqft && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{property.size_sqft.toLocaleString()} sq ft</span>
                            </div>
                          )}
                          
                          {property.base_rent_psf && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>${property.base_rent_psf}/sq ft</span>
                            </div>
                          )}
                          
                          <div className="pt-2 flex justify-end gap-1 sm:gap-2">
                            <Button 
                              variant="subtle" 
                              size="icon"
                              onClick={() => router.push(`/properties/${property.id}`)}
                              title="View Details"
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {properties.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No properties found</h3>
                      <p className="mt-2 text-muted-foreground">
                        No School of Rock properties available.
                      </p>
                    </div>
                  )}
                </>
                              ) : (
                  <div className="w-full overflow-hidden">
                    <DataTable 
                      columns={columns} 
                      data={properties} 
                      searchKey="title"
                      searchPlaceholder="Filter properties by title..."
                    />
                  </div>
                )}
            </CardContent>
          </Card>
        </div>


      </SidebarInset>
    </SidebarProvider>
  )
}
