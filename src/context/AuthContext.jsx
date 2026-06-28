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
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      if (!existing.friend_code) {
        const code = 'FOCUS-' + genSuffix()
        await supabase.from('users').update({ friend_code: code }).eq('id', userId)
        existing.friend_code = code
      }
      setUserProfile(existing)
      setProfileLoaded(true)
      return
    }

    // No profile yet — auto-create for OAuth (Google) users
    const { data: { session } } = await supabase.auth.getSession()
    const provider = session?.user?.app_metadata?.provider
    const meta     = session?.user?.user_metadata

    if (provider === 'google' && meta) {
      const name = (meta.full_name || meta.name || 'Friend').trim()
      const { data: created } = await supabase
        .from('users')
        .insert({
          id:            userId,
          name,
          avatar_letter: name[0]?.toUpperCase() ?? '?',
          friend_code:   'FOCUS-' + genSuffix(),
        })
        .select()
        .single()
      setUserProfile(created ?? null)
    } else {
      setUserProfile(null)
    }

    setProfileLoaded(true)
  }

  function genSuffix() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
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
