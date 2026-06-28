import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still loading
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setProfileLoaded(true)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
      if (session) loadProfile(session.user.id)
      else setProfileLoaded(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
      if (session) loadProfile(session.user.id)
      else { setUserProfile(null); setProfileLoaded(true) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('*, groups(id, name, invite_code)')
      .eq('id', userId)
      .maybeSingle()
    setUserProfile(data ?? null)
    setProfileLoaded(true)
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) await loadProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={{ session, userProfile, profileLoaded, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
