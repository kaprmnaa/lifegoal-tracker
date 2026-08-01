import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, usernameToEmail, isValidUsername } from '../lib/supabaseClient'

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
      .from('financetrack_profiles')
      .select('id, username, created_at')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      loadProfile(data.session?.user?.id).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfile(newSession?.user?.id)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  async function signUp(username, password) {
    if (!isValidUsername(username)) {
      throw new Error('Username 3-20 karakter, hanya huruf, angka, dan underscore.')
    }
    if (!password || password.length < 6) {
      throw new Error('Password minimal 6 karakter.')
    }

    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim().toLowerCase() } },
    })

    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        throw new Error('Username sudah dipakai. Coba username lain.')
      }
      throw error
    }
    return data
  }

  async function signIn(username, password) {
    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error('Username atau password salah.')
    }
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

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
