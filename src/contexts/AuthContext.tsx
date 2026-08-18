import type { User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { authService } from '../services/auth'
import type { Profile } from '../types'

interface AuthValue { user: User | null; profile: Profile | null; loading: boolean; refreshProfile: () => Promise<void>; signIn: (username: string, password: string) => Promise<void>; signUp: (username: string, password: string, fullName: string) => Promise<void>; changePassword: (password: string) => Promise<void>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) { setProfile(null); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle()
    if (error) { setProfile(null); return }
    setProfile(data as Profile | null)
  }, [])

  useEffect(() => {
    let active = true
    const startupFallback = window.setTimeout(() => { if (active) setLoading(false) }, 2500)
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      setLoading(false)
      window.clearTimeout(startupFallback)
      void loadProfile(sessionUser)
    }).catch(() => { if (active) setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      setLoading(false)
      setTimeout(() => void loadProfile(sessionUser), 0)
    })
    return () => { active = false; window.clearTimeout(startupFallback); data.subscription.unsubscribe() }
  }, [loadProfile])

  const value = useMemo<AuthValue>(() => ({ user, profile, loading, refreshProfile: () => loadProfile(user), signIn: async (username, password) => { const { error } = await authService.signIn(username, password); if (error) throw error }, signUp: async (username, password, fullName) => { const { error } = await authService.signUp(username, password, fullName); if (error) throw error }, changePassword: async (password) => { const { error } = await authService.changePassword(password); if (error) throw error }, signOut: async () => { const { error } = await authService.signOut(); if (error) throw error } }), [user, profile, loading, loadProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Provider and hook intentionally share one module so consumers use the same private context.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
