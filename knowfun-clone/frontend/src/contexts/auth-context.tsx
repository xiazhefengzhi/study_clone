/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, type User } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from backend
  const fetchUserProfile = async (token: string) => {
    try {
      apiClient.setToken(token)
      const userData = await apiClient.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      setUser(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.access_token) {
        fetchUserProfile(session.access_token)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null)

        if (session?.access_token) {
          await fetchUserProfile(session.access_token)
        } else {
          setUser(null)
          apiClient.setToken(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await apiClient.login(email, password)

      // Set Supabase session
      const { error } = await supabase.auth.setSession({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      })

      if (error) throw error

      // User profile will be fetched by onAuthStateChange
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      const response = await apiClient.register(email, password, username)

      // Set Supabase session
      const { error } = await supabase.auth.setSession({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      })

      if (error) throw error

      // User profile will be fetched by onAuthStateChange
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
      apiClient.setToken(null)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      await fetchUserProfile(session.access_token)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
