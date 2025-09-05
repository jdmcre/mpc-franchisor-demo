"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, Table } from "lucide-react"

interface ViewToggleProps {
  view: 'cards' | 'table'
  onViewChange: (view: 'cards' | 'table') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={view === 'cards' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="flex items-center gap-1 px-3"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="flex items-center gap-1 px-3"
      >
        <Table className="h-4 w-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  )
}
