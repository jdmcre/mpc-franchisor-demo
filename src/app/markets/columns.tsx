"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Property, Market } from "@/lib/supabase"

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

export const createPropertyColumns = (onViewDetails: (property: Property) => void): ColumnDef<Property>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Property
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      const address = row.original.address_line
      const city = row.original.city
      const state = row.original.state
      const postalCode = row.original.postal_code
      const photoUrl = row.original.photo_url
      
      // Use same logic as map view: if title is empty, use address_line
      const displayTitle = title || address || 'Untitled Property'
      
      // Format postal code to show only first 5 digits
      const formattedPostalCode = postalCode ? postalCode.substring(0, 5) : ''
      
      return (
        <div 
          className="group flex items-center gap-3 min-w-[280px] cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded-md transition-colors"
          onClick={() => onViewDetails(row.original)}
        >
          {/* Property Image - Increased by 100% (from 48px to 96px) */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={displayTitle} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Property Details */}
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate" title={displayTitle}>
              {displayTitle}
            </div>
            {/* Only show address_line if title exists (same logic as map view) */}
            {title && address && (
              <div className="text-sm text-muted-foreground truncate" title={address}>
                {address}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {[city, state, formattedPostalCode].filter(Boolean).join(', ')}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View Details
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "size_sqft",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full justify-center"
        >
          Size (sq ft)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const size = row.getValue("size_sqft") as number
      if (!size) return <div className="text-sm text-muted-foreground text-center">N/A</div>
      
      return (
        <div className="text-sm text-center w-20">
          {size.toLocaleString()}
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: "base_rent_psf",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full justify-start"
        >
          Base Rent ($/sq ft)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const rent = row.getValue("base_rent_psf") as number
      const expenses = row.original.expenses_psf
      
      if (!rent) return <div className="text-sm text-muted-foreground">N/A</div>
      
      return (
        <div className="text-sm w-32">
          <div>${rent.toFixed(2)}/SF</div>
          {expenses && (
            <div className="text-muted-foreground">+ ${expenses.toFixed(2)} expenses</div>
          )}
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "phase",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full justify-start"
        >
          Phase
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const phase = row.getValue("phase") as string
      
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
        <div className="w-32">
          <Badge 
            variant={getPhaseVariant(phase)}
            className="text-xs font-medium"
          >
            {getPhaseLabel(phase)}
          </Badge>
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string
      if (!notes) return <div className="text-sm text-muted-foreground">No notes</div>
      
      // Truncate notes if they're too long, but allow line breaks
      const maxLength = 100
      const truncatedNotes = notes.length > maxLength ? notes.substring(0, maxLength) + '...' : notes
      
      return (
        <div className="text-sm min-w-0 flex-1" title={notes}>
          <div className="whitespace-pre-wrap break-words">
            {truncatedNotes}
          </div>
        </div>
      )
    },
    size: 200,
  },
]

export const createColumns = (handleViewUpdates: (marketId: string) => void): ColumnDef<MarketWithDetails>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Market Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium max-w-[200px] truncate" title={row.getValue("name")}>
          {row.getValue("name")}
        </div>
      )
    },
  },
  {
    accessorKey: "propertyCount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Properties
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const count = row.getValue("propertyCount") as number
      return (
        <div className="text-sm">
          {count}
        </div>
      )
    },
  },
  {
    accessorKey: "franchisees",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Franchisee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const franchisees = row.getValue("franchisees") as Array<{
        id: string
        full_name: string | null
        email: string | null
        phone: string | null
        avatar_url: string | null
        status: string | null
      }>
      
      if (!franchisees || franchisees.length === 0) {
        return <div className="text-sm text-muted-foreground">No franchisee</div>
      }
      
      // Get the first franchisee (assuming one per market for now)
      const franchisee = franchisees[0]
      
      if (!franchisee.full_name) {
        return <div className="text-sm text-muted-foreground">No name</div>
      }
      
      return (
        <div className="min-w-[120px]">
          <div className="text-sm font-medium truncate" title={franchisee.full_name}>
            {franchisee.full_name}
          </div>
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "phases",
    header: "Phases",
    cell: ({ row }) => {
      const phases = row.getValue("phases") as string[]
      if (!phases || phases.length === 0) {
        return <div className="text-sm text-muted-foreground">No phases</div>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {phases.slice(0, 2).map((phase, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {phase}
            </Badge>
          ))}
          {phases.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{phases.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const market = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleViewUpdates(market.id)
            }}
          >
            View Updates
          </Button>
        </div>
      )
    },
  },
]