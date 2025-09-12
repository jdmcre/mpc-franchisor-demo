import { supabase, Market, Property, MarketUpdate } from './supabase'

// Client ID for this portal - updated to new client
const CLIENT_ID = '39022dd3-45f4-4e82-b9bd-5c9733404728'

export class DataService {

  // Fetch all markets for this client
  static async getMarkets(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .order('name')
    
    if (error) {
      console.error('Error fetching markets:', error)
      return []
    }
    
    return data || []
  }

  // Fetch single market by ID
  static async getMarket(id: string): Promise<Market | null> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching market:', error)
      return null
    }
    
    return data
  }



  // Fetch all properties for this client
  static async getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        markets!inner(client_id)
      `)
      .eq('markets.client_id', CLIENT_ID)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching properties:', error)
      return []
    }
    
    return data || []
  }

  // Fetch properties by market (only for this client)
  static async getPropertiesByMarket(marketId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        markets!inner(client_id)
      `)
      .eq('market_id', marketId)
      .eq('markets.client_id', CLIENT_ID)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching properties by market:', error)
      return []
    }
    
    return data || []
  }

  // Fetch single property by ID
  static async getProperty(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching property:', error)
      return null
    }
    
    return data
  }





  // Fetch dashboard stats with enhanced market property counts
  static async getDashboardStats() {
    const [markets, properties] = await Promise.all([
      this.getMarkets(),
      this.getProperties()
    ])

    // Get property counts per market
    const marketPropertyCounts = await Promise.all(
      markets.map(async (market) => {
        const propertyCount = await this.getPropertiesByMarket(market.id)
        return {
          marketId: market.id,
          propertyCount: propertyCount.length
        }
      })
    )

    return {
      totalMarkets: markets.length,
      totalProperties: properties.length,
      recentProperties: properties.slice(0, 5),
      marketPropertyCounts
    }
  }

  // Fetch franchisees for a specific market
  static async getMarketFranchisees(marketId: string) {
    const { data, error } = await supabase
      .from('market_users')
      .select(`
        *,
        users!inner(*)
      `)
      .eq('market_id', marketId)
      .eq('role', 'franchisee')
      .eq('users.role', 'franchisee')
    
    if (error) {
      console.error('Error fetching market franchisees:', error)
      return []
    }
    
    return data?.map(item => item.users) || []
  }

  // Helper function to get the furthest along phase
  private static getFurthestPhase(phases: string[]): string | null {
    if (phases.length === 0) return null
    
    // Define phase order from earliest to latest
    const phaseOrder = ['intro', 'site_selection', 'loi', 'lease', 'closed']
    
    // Find the highest index phase that exists in the phases array
    let furthestPhaseIndex = -1
    let furthestPhase = null
    
    for (const phase of phases) {
      const phaseIndex = phaseOrder.indexOf(phase.toLowerCase())
      if (phaseIndex > furthestPhaseIndex) {
        furthestPhaseIndex = phaseIndex
        furthestPhase = phase
      }
    }
    
    return furthestPhase
  }

  // Fetch enhanced market data with property counts, phases, and franchisee information
  static async getMarketsWithDetails(): Promise<(Market & { 
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
  })[]> {
    const markets = await this.getMarkets()

    const marketsWithDetails = await Promise.all(
      markets.map(async (market) => {
        const [properties, franchisees] = await Promise.all([
          this.getPropertiesByMarket(market.id),
          this.getMarketFranchisees(market.id)
        ])
        
        // Extract unique phases from properties
        const allPhases = [...new Set(properties.map(p => p.phase).filter(Boolean))]
        
        // Get only the furthest along phase
        const furthestPhase = this.getFurthestPhase(allPhases)
        const phases = furthestPhase ? [furthestPhase] : []
        
        return {
          ...market,
          propertyCount: properties.length,
          phases,
          franchisees
        }
      })
    )

    return marketsWithDetails
  }

  // Market Updates Methods
  static async getMarketUpdates(marketId?: string): Promise<MarketUpdate[]> {
    let query = supabase
      .from('market_updates')
      .select('*')
      .order('created_at', { ascending: false })

    if (marketId) {
      query = query.eq('market_id', marketId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching market updates:', error)
      return []
    }

    return data || []
  }

  static async createMarketUpdate(marketId: string, author: string, message: string): Promise<MarketUpdate | null> {
    const { data, error } = await supabase
      .from('market_updates')
      .insert({
        market_id: marketId,
        author,
        message
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating market update:', error)
      return null
    }

    return data
  }

  static async updateMarketUpdate(id: string, message: string): Promise<MarketUpdate | null> {
    const { data, error } = await supabase
      .from('market_updates')
      .update({ message })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating market update:', error)
      return null
    }

    return data
  }

  static async deleteMarketUpdate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('market_updates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting market update:', error)
      return false
    }

    return true
  }
}
