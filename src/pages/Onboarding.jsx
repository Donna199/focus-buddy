import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { session, userProfile, profileLoaded, refreshProfile } = useAuth()

  const [step, setStep] = useState('welcome') // welcome|signup|signin|confirm|rules
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session === undefined) return
    if (session && userProfile) {
      navigate('/', { replace: true })
    } else if (session && profileLoaded && !userProfile) {
      setError('Account setup incomplete. Please create a new account.')
      supabase.auth.signOut()
    }
  }, [session, userProfile, profileLoaded, navigate])

  function clearError() { setError('') }

  // ── Sign up ───────────────────────────────────────────────────────────────
  async function handleSignUp() {
    if (!supabase) {
      setError('App is not connected to the database. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your Vercel environment variables, then redeploy.')
      return
    }
    clearError()
    setLoading(true)
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (authErr) throw new Error(authErr.message)

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const suffix = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')

      const { error: profileErr } = await supabase.from('users').insert({
        id:            data.user.id,
        name:          name.trim(),
        avatar_letter: name.trim()[0]?.toUpperCase() ?? '?',
        friend_code:   'FOCUS-' + suffix,
      })
      if (profileErr) throw new Error(profileErr.message)

      if (!data.session) {
        setStep('confirm')
      } else {
        await refreshProfile()
        setStep('rules')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  async function handleSignIn() {
    if (!supabase) {
      setError('App is not connected to the database. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your Vercel environment variables, then redeploy.')
      return
    }
    clearError()
    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authErr) throw new Error(authErr.message)
      // onAuthStateChange in AuthContext handles the redirect
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (session === undefined) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>Loading…</p>
      </div>
    )
  }

  if (step === 'welcome') {
    return (
      <div className="screen onboarding-screen welcome">
        <div className="welcome-content">
          <p className="eyebrow">Focus Buddy</p>
          <h1 className="welcome-title">Beat the scroll.<br/>Together.</h1>
          <p className="welcome-tagline">
            Compete with friends to swap doomscrolling for focus. Log activities, earn points, climb the ranking.
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={() => setStep('signup')}>Create account</button>
          <button className="btn btn-ghost" onClick={() => setStep('signin')}>Sign in</button>
        </div>
      </div>
    )
  }

  if (step === 'signup') {
    return (
      <div className="screen onboarding-screen">
        <p className="eyebrow">Create account</p>
        <h1>Join Focus Buddy</h1>
        <p className="onboarding-sub">Your friends will see your name on the feed.</p>

        <div className="auth-form">
          <div className="field">
            <label className="field-label">Your name</label>
            <input
              type="text"
              placeholder="e.g. Donna"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn btn-primary"
            disabled={loading || !name.trim() || !email.trim() || password.length < 6}
            onClick={handleSignUp}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setStep('signin'); clearError() }}>
            Already have an account? Sign in
          </button>
        </div>
      </div>
    )
  }

  if (step === 'signin') {
    return (
      <div className="screen onboarding-screen">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>

        <div className="auth-form">
          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn btn-primary"
            disabled={loading || !email.trim() || !password}
            onClick={handleSignIn}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setStep('signup'); clearError() }}>
            Don't have an account? Create one
          </button>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="screen onboarding-screen">
        <p className="eyebrow">Almost there</p>
        <h1>Check your email</h1>
        <p className="onboarding-sub">
          We sent a confirmation link to <strong>{email}</strong>.
          Click it, then come back and sign in.
        </p>
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-primary" onClick={() => { setStep('signin'); clearError() }}>
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  // rules (final step)
  return (
    <div className="screen onboarding-screen">
      <p className="eyebrow">How it works</p>
      <h1>Compete with friends</h1>

      <div className="rules-list">
        <div className="rule-item good">
          <span className="rule-icon">+</span>
          <div>
            <p className="rule-title">Good activities earn points</p>
            <p className="rule-desc">Focus, study, exercise, read. Points scale with time.</p>
          </div>
        </div>
        <div className="rule-item bad">
          <span className="rule-icon">−</span>
          <div>
            <p className="rule-title">Bad activities lose points</p>
            <p className="rule-desc">Doomscrolling, binges. Log honestly — friends keep it real.</p>
          </div>
        </div>
        <div className="rule-item bonus">
          <span className="rule-icon">★</span>
          <div>
            <p className="rule-title">Bonus activities are easy wins</p>
            <p className="rule-desc">No phone at meals, walk without music. Small fixed points, capped daily.</p>
          </div>
        </div>
      </div>

      <p className="onboarding-sub" style={{ marginBottom: 20 }}>
        Add friends from the Profile tab using your personal code. Rankings update live.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/', { replace: true })}>
        Start competing
      </button>
    </div>
  )
}
