import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

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

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    if (!supabase) {
      setError('App is not connected to the database.')
      return
    }
    clearError()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

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
          <button className="btn-google" onClick={handleGoogleSignIn}>
            <GoogleIcon /> Continue with Google
          </button>
          <div className="auth-divider"><span>or</span></div>
          <button className="btn btn-primary" onClick={() => setStep('signup')}>Create account with email</button>
          <button className="btn btn-ghost" onClick={() => setStep('signin')}>Sign in with email</button>
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
          <div className="auth-divider"><span>or</span></div>
          <button className="btn-google" onClick={handleGoogleSignIn}>
            <GoogleIcon /> Continue with Google
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
          <div className="auth-divider"><span>or</span></div>
          <button className="btn-google" onClick={handleGoogleSignIn}>
            <GoogleIcon /> Continue with Google
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
