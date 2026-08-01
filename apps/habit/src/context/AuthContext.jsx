import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, usernameToEmail } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('hbits_profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async (username, password) => {
    const clean = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,24}$/.test(clean)) {
      throw new Error('Username 3-24 karakter, hanya huruf kecil, angka, dan underscore.')
    }
    const email = usernameToEmail(clean)

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new Error('Username sudah dipakai. Coba username lain.')
      }
      throw error
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('hbits_profiles')
        .insert({ id: data.user.id, username: clean })
      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Username sudah dipakai. Coba username lain.')
        }
        throw profileError
      }
      setProfile({ id: data.user.id, username: clean })
    }
    return data
  }, [])

  const signIn = useCallback(async (username, password) => {
    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error('Username atau password salah.')
    }
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
