/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'
import { User } from '@/types/api'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<{ requiresEmailVerification: boolean; message: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync user profile for OAuth users (Google login)
  const syncUserProfile = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/v1/auth/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        return userData
      }
      return null
    } catch (error) {
      console.error('Failed to sync user profile:', error)
      return null
    }
  }

  // Fetch user profile from backend
  const fetchUserProfile = async (token: string) => {
    try {
      apiClient.setToken(token)
      const userData = await apiClient.getCurrentUser()
      setUser(userData)
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error)

      // If user not found (404), try to sync profile (for OAuth users like Google)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.log('User not found, trying to sync profile...')
        const syncedUser = await syncUserProfile(token)
        if (syncedUser) {
          setUser(syncedUser)
          return
        }
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 应用待处理的推荐码
  const applyPendingReferralCode = async (token: string) => {
    try {
      const pendingCode = localStorage.getItem('pending_referral_code')
      if (!pendingCode) return

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}/api/v1/referrals/apply?referral_code=${encodeURIComponent(pendingCode)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        console.log('Referral code applied successfully')
        localStorage.removeItem('pending_referral_code')
      }
    } catch (error) {
      console.error('Failed to apply referral code:', error)
    }
  }

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

      // Fetch user profile immediately to ensure it's ready before navigation
      await fetchUserProfile(response.access_token)

      // 应用待处理的推荐码（首次登录后）
      await applyPendingReferralCode(response.access_token)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string): Promise<{ requiresEmailVerification: boolean; message: string }> => {
    try {
      setLoading(true)
      const response: any = await apiClient.register(email, password, username)

      // Check if email verification is required
      if (response.requires_email_verification) {
        return {
          requiresEmailVerification: true,
          message: response.message
        }
      }

      // No email verification required, set session directly
      if (response.access_token && response.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        })

        if (error) throw error

        // Fetch user profile immediately to ensure it's ready before navigation
        await fetchUserProfile(response.access_token)
      }

      return {
        requiresEmailVerification: false,
        message: response.message
      }
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
