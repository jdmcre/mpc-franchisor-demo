"use client"

import { Button } from "@/components/ui/button"
import { Map, List } from "lucide-react"

interface MapListToggleProps {
  view: 'map' | 'list'
  onViewChange: (view: 'map' | 'list') => void
}

export function MapListToggle({ view, onViewChange }: MapListToggleProps) {
  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={view === 'map' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('map')}
        className="flex items-center gap-1 px-3"
      >
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">Map View</span>
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center gap-1 px-3"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List View</span>
      </Button>
    </div>
  )
}
