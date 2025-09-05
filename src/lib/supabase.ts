import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arfhkkmrmjworxfilslg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZmhra21ybWp3b3J4Zmlsc2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjE1MjUsImV4cCI6MjA3MTg5NzUyNX0.PZA8sd1Tes8FbCD2mxoYElzcX9rU8oFG8F_erukvYvg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the schema - School of Rock portal only

export interface Market {
  id: string
  client_id: string
  name: string
  territory?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  market_id: string
  title?: string
  address_line?: string
  city?: string
  state?: string
  postal_code?: string
  lat?: number
  lng?: number
  size_sqft?: number
  base_rent_psf?: number
  expenses_psf?: number
  phase: string
  display_number?: number
  photo_url?: string
  created_at: string
  updated_at: string
}

export interface MarketUpdate {
  id: string
  market_id: string
  author: string
  message: string
  created_at: string
  updated_at: string
}


