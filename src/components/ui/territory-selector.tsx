"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, X, Search, Check } from 'lucide-react'

interface Territory {
  states: string[]
  counties: Record<string, string[]> // state -> counties
}

interface TerritorySelectorProps {
  value?: Territory
  onChange: (territory: Territory) => void
  className?: string
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
]

// Sample counties for major states (in a real app, you'd have a complete database)
const SAMPLE_COUNTIES: Record<string, string[]> = {
  'CA': ['Los Angeles', 'San Diego', 'Orange', 'Riverside', 'San Bernardino'],
  'TX': ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis'],
  'NY': ['Kings', 'Queens', 'New York', 'Suffolk', 'Bronx'],
  'FL': ['Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange'],
  'IL': ['Cook', 'DuPage', 'Lake', 'Will', 'Kane'],
  'PA': ['Allegheny', 'Philadelphia', 'Montgomery', 'Bucks', 'Delaware'],
  'OH': ['Cuyahoga', 'Franklin', 'Hamilton', 'Summit', 'Montgomery'],
  'GA': ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Clayton'],
  'NC': ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland'],
  'MI': ['Wayne', 'Oakland', 'Macomb', 'Kent', 'Genesee']
}

export function TerritorySelector({ value, onChange, className }: TerritorySelectorProps) {
  const [selectedStates, setSelectedStates] = useState<string[]>(value?.states || [])
  const [selectedCounties, setSelectedCounties] = useState<Record<string, string[]>>(value?.counties || {})
  const [searchTerm, setSearchTerm] = useState('')
  const [showCounties, setShowCounties] = useState<string | null>(null)

  const handleStateToggle = (stateCode: string) => {
    const newSelectedStates = selectedStates.includes(stateCode)
      ? selectedStates.filter(s => s !== stateCode)
      : [...selectedStates, stateCode]

    setSelectedStates(newSelectedStates)

    // Remove counties for deselected states
    const newSelectedCounties = { ...selectedCounties }
    if (!newSelectedStates.includes(stateCode)) {
      delete newSelectedCounties[stateCode]
      setSelectedCounties(newSelectedCounties)
    }

    updateTerritory(newSelectedStates, newSelectedCounties)
  }

  const handleCountyToggle = (stateCode: string, countyName: string) => {
    const currentCounties = selectedCounties[stateCode] || []
    const newCounties = currentCounties.includes(countyName)
      ? currentCounties.filter(c => c !== countyName)
      : [...currentCounties, countyName]

    const newSelectedCounties = {
      ...selectedCounties,
      [stateCode]: newCounties
    }

    setSelectedCounties(newSelectedCounties)
    updateTerritory(selectedStates, newSelectedCounties)
  }

  const updateTerritory = (states: string[], counties: Record<string, string[]>) => {
    onChange({
      states,
      counties
    })
  }

  const filteredStates = US_STATES.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStateCounties = (stateCode: string) => {
    return SAMPLE_COUNTIES[stateCode] || []
  }

  const hasCounties = (stateCode: string) => {
    return SAMPLE_COUNTIES[stateCode] && SAMPLE_COUNTIES[stateCode].length > 0
  }

  const getSelectedCount = () => {
    const stateCount = selectedStates.length
    const countyCount = Object.values(selectedCounties).reduce((sum, counties) => sum + counties.length, 0)
    return { states: stateCount, counties: countyCount }
  }

  const clearAll = () => {
    setSelectedStates([])
    setSelectedCounties({})
    updateTerritory([], {})
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Territory Selection
          </CardTitle>
          <CardDescription>
            Select states and counties to define your market territory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {getSelectedCount().states} states
              </Badge>
              <Badge variant="outline">
                {getSelectedCount().counties} counties
              </Badge>
            </div>
            {getSelectedCount().states > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* States Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {filteredStates.map((state) => (
              <div key={state.code} className="space-y-2">
                <Button
                  variant={selectedStates.includes(state.code) ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => handleStateToggle(state.code)}
                >
                  <span className="text-left">
                    <div className="font-medium">{state.name}</div>
                    <div className="text-xs text-muted-foreground">{state.code}</div>
                  </span>
                  {selectedStates.includes(state.code) && (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Counties for this state */}
                {selectedStates.includes(state.code) && hasCounties(state.code) && (
                  <div className="ml-4 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setShowCounties(showCounties === state.code ? null : state.code)}
                    >
                      {showCounties === state.code ? 'Hide' : 'Show'} counties
                    </Button>
                    
                    {showCounties === state.code && (
                      <div className="space-y-1">
                        {getStateCounties(state.code).map((county) => (
                          <div key={county} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`${state.code}-${county}`}
                              checked={selectedCounties[state.code]?.includes(county) || false}
                              onChange={() => handleCountyToggle(state.code, county)}
                              className="h-3 w-3"
                            />
                            <Label htmlFor={`${state.code}-${county}`} className="text-xs">
                              {county}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected Summary */}
          {getSelectedCount().states > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Selected Territory:</h4>
              <div className="space-y-2">
                {selectedStates.map(stateCode => {
                  const state = US_STATES.find(s => s.code === stateCode)
                  const counties = selectedCounties[stateCode] || []
                  
                  return (
                    <div key={stateCode} className="text-sm">
                      <span className="font-medium">{state?.name}</span>
                      {counties.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({counties.length} counties: {counties.join(', ')})
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
