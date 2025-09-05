'use client'

import { useEffect, useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Building2, MapPin, UserCheck, Globe, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { Property, Market } from '@/lib/supabase'
import Link from 'next/link'

interface WeeklyChange {
  id: string
  type: 'property' | 'market'
  action: 'created' | 'updated' | 'deleted'
  item: Property | Market
  timestamp: string
  description: string
}

export default function WeeklyUpdatesPage() {
  const [changes, setChanges] = useState<WeeklyChange[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    properties: 0,
    markets: 0,
    clients: 0,
    users: 0
  })

  useEffect(() => {
    const fetchWeeklyChanges = async () => {
      try {
        // Get all data
        const [properties, markets] = await Promise.all([
          DataService.getProperties(),
          DataService.getMarkets()
        ])

        // Calculate changes from the past week
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const weeklyChanges: WeeklyChange[] = []

        // Check properties for recent changes
        properties.forEach(property => {
          const created = new Date(property.created_at)
          const updated = new Date(property.updated_at)
          
          if (created >= oneWeekAgo) {
            weeklyChanges.push({
              id: property.id,
              type: 'property',
              action: 'created',
              item: property,
              timestamp: property.created_at,
              description: `New property: ${property.title || property.address_line || 'Untitled Property'}`
            })
          } else if (updated >= oneWeekAgo && updated > created) {
            weeklyChanges.push({
              id: property.id,
              type: 'property',
              action: 'updated',
              item: property,
              timestamp: property.updated_at,
              description: `Property updated: ${property.title || property.address_line || 'Untitled Property'}`
            })
          }
        })

        // Check markets for recent changes
        markets.forEach(market => {
          const created = new Date(market.created_at)
          const updated = new Date(market.updated_at)
          
          if (created >= oneWeekAgo) {
            weeklyChanges.push({
              id: market.id,
              type: 'market',
              action: 'created',
              item: market,
              timestamp: market.created_at,
              description: `New market: ${market.name}`
            })
          } else if (updated >= oneWeekAgo && updated > created) {
            weeklyChanges.push({
              id: market.id,
              type: 'market',
              action: 'updated',
              item: market,
              timestamp: market.updated_at,
              description: `Market updated: ${market.name}`
            })
          }
        })



        // Sort by timestamp (newest first)
        weeklyChanges.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setChanges(weeklyChanges)
        setStats({
          properties: weeklyChanges.filter(c => c.type === 'property').length,
          markets: weeklyChanges.filter(c => c.type === 'market').length,
          clients: 0,
          users: 0
        })
      } catch (error) {
        console.error('Error fetching weekly changes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeeklyChanges()
  }, [])

  const getItemLink = (change: WeeklyChange) => {
    switch (change.type) {
      case 'property':
        return `/properties/${change.id}`
      case 'market':
        return `/markets/${change.id}`
      default:
        return '#'
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building2 className="h-4 w-4" />
      case 'market':
        return <MapPin className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'created':
        return 'default'
      case 'updated':
        return 'secondary'
      case 'deleted':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-3 w-3" />
      case 'updated':
        return <Edit className="h-3 w-3" />
      case 'deleted':
        return <Trash2 className="h-3 w-3" />
      default:
        return <TrendingUp className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading weekly updates...</div>
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
                  <BreadcrumbLink href="/chat">Chat</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Weekly Updates</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4 flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Week
            </Badge>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Updates</CardTitle>
              <CardDescription>
                Overview of all activities and changes from the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Property Updates</span>
                      <Badge variant="outline">{stats.properties}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Recent changes to properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.properties > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {stats.properties} property changes this week
                      </p>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm">No property updates this week</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Market Changes</span>
                      <Badge variant="outline">{stats.markets}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Market-related updates and changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.markets > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {stats.markets} market changes this week
                      </p>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm">No market changes this week</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Client Activity</span>
                      <Badge variant="outline">{stats.clients}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Client interactions and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.clients > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {stats.clients} client changes this week
                      </p>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm">No client activity this week</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>User Changes</span>
                      <Badge variant="outline">{stats.users}</Badge>
                    </CardTitle>
                    <CardDescription>
                      User account updates and changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.users > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {stats.users} user changes this week
                      </p>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm">No user changes this week</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Summary</CardTitle>
                  <CardDescription>
                    Detailed breakdown of all activities and changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {changes.length > 0 ? (
                    <div className="space-y-4">
                      {changes.map((change) => (
                        <div key={`${change.type}-${change.id}-${change.timestamp}`} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getItemIcon(change.type)}
                            <div>
                              <h4 className="font-medium">{change.description}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(change.timestamp).toLocaleDateString()} at {new Date(change.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionBadgeVariant(change.action)} className="flex items-center gap-1">
                              {getActionIcon(change.action)}
                              {change.action}
                            </Badge>
                            <Button asChild variant="outline" size="sm">
                              <Link href={getItemLink(change)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Changes This Week</h3>
                      <p className="text-muted-foreground">
                        No items were created, updated, or deleted in the past week.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
