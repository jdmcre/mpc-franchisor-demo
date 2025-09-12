"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Building2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Market } from "@/lib/supabase"

// Component for the actions cell
function ActionsCell({ marketId, onViewUpdates }: { marketId: string, onViewUpdates: (marketId: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onViewUpdates(marketId)
      }}
      className="flex items-center gap-2"
    >
      View Updates
    </Button>
  )
}

// Component for the market name cell
function MarketNameCell({ marketName }: { marketName: string }) {
  return (
    <div className="font-medium">
      {marketName}
    </div>
  )
}

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

export const createColumns = (
  onViewUpdates: (marketId: string) => void
): ColumnDef<MarketWithDetails>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const marketName = row.getValue("name") as string
      
      return (
        <MarketNameCell
          marketName={marketName}
        />
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
          <User className="mr-2 h-4 w-4" />
          Franchisee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const franchisees = row.original.franchisees
      if (franchisees.length === 0) {
        return (
          <div className="text-sm text-muted-foreground">
            No franchisee
          </div>
        )
      }
      
      // Show the first franchisee (assuming one per market)
      const franchisee = franchisees[0]
      return (
        <div className="text-sm font-medium">
          {franchisee.full_name || 'Unnamed Franchisee'}
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
          <Building2 className="mr-2 h-4 w-4" />
          Properties
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm font-medium">
          {row.original.propertyCount}
        </div>
      )
    },
  },
  {
    accessorKey: "phases",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phase
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const phases = row.original.phases
      if (phases.length === 0) {
        return (
          <div className="text-sm text-muted-foreground">
            No properties
          </div>
        )
      }
      
      // Display only the single furthest along phase
      const phase = phases[0]
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {normalizePhaseText(phase)}
        </span>
      )
    },
  },

  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"))
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
      return <ActionsCell marketId={row.original.id} onViewUpdates={onViewUpdates} />
    },
  },

]
