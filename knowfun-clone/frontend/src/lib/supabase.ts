/**
 * Supabase client configuration for frontend
 *
 * This file creates and exports the Supabase client instance
 */

import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Types for our database tables
export type User = {
  id: number
  supabase_user_id: string
  email: string
  username: string
  avatar_url: string | null
  subscription_tier: string
  points_balance: number
  storage_used: number
  created_at: string
  updated_at: string
}

export type Document = {
  id: number
  user_id: number
  title: string
  description: string | null
  file_url: string
  file_path: string
  file_type: string
  file_size: number
  status: string
  created_at: string
  updated_at: string
}

export type Course = {
  id: number
  user_id: number
  document_id: number | null
  title: string
  description: string | null
  style: string
  difficulty: string
  content: any | null
  status: string
  cover_image: string | null
  views_count: number
  likes_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}
