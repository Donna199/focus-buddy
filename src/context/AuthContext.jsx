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
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data && !data.friend_code) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const suffix = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')
      const friendCode = 'FOCUS-' + suffix
      await supabase.from('users').update({ friend_code: friendCode }).eq('id', userId)
      data.friend_code = friendCode
    }

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
