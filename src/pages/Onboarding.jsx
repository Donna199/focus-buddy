import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { session, userProfile, refreshProfile } = useAuth()

  const [step, setStep] = useState('welcome') // welcome|signup|signin|confirm|group|rules
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [groupCode, setGroupCode] = useState('') // shown after creating a group
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already fully onboarded; jump to group step if signed in but groupless
  useEffect(() => {
    if (session === undefined) return
    if (session && userProfile?.group_id) {
      navigate('/', { replace: true })
    } else if (session && userProfile && !userProfile.group_id) {
      setName(userProfile.name || '')
      setStep('group')
    }
  }, [session, userProfile, navigate])

  function clearError() { setError('') }

  // ── Sign up ───────────────────────────────────────────────────────────────
  async function handleSignUp() {
    clearError()
    setLoading(true)

    const { data, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    // Create the public profile immediately (before email confirmation)
    const { error: profileErr } = await supabase.from('users').insert({
      id:            data.user.id,
      name:          name.trim(),
      avatar_letter: name.trim()[0]?.toUpperCase() ?? '?',
    })
    if (profileErr) { setError(profileErr.message); setLoading(false); return }

    setLoading(false)

    if (!data.session) {
      // Email confirmation is required — ask them to verify
      setStep('confirm')
    } else {
      // Email confirmation disabled — session is live, move to group setup
      await refreshProfile()
      setStep('group')
    }
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  async function handleSignIn() {
    clearError()
    setLoading(true)

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    setLoading(false)
    // onAuthStateChange in AuthContext handles session + profile load;
    // useEffect above redirects once userProfile is set
  }

  // ── Join existing group ───────────────────────────────────────────────────
  async function handleJoinGroup() {
    clearError()
    setLoading(true)

    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle()

    if (groupErr || !group) {
      setError('No group found with that code. Double-check and try again.')
      setLoading(false)
      return
    }

    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const uid = currentSession?.user?.id
    if (!uid) { setError('Session expired. Please sign in again.'); setLoading(false); return }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ group_id: group.id })
      .eq('id', uid)

    if (updateErr) { setError(updateErr.message); setLoading(false); return }

    await refreshProfile()
    setLoading(false)
    setStep('rules')
  }

  // ── Create new group ──────────────────────────────────────────────────────
  async function handleCreateGroup() {
    clearError()
    setLoading(true)

    // Generate a readable, collision-resistant invite code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const suffix = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    const inviteCode = 'SQUAD-' + suffix

    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .insert({ name: `${name || 'My'}'s Squad`, invite_code: inviteCode })
      .select('id, invite_code')
      .single()

    if (groupErr) { setError(groupErr.message); setLoading(false); return }

    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const uid = currentSession?.user?.id
    if (!uid) { setError('Session expired. Please sign in again.'); setLoading(false); return }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ group_id: group.id })
      .eq('id', uid)

    if (updateErr) { setError(updateErr.message); setLoading(false); return }

    await refreshProfile()
    setGroupCode(group.invite_code)
    setLoading(false)
    setStep('rules')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Block render until we know auth state (avoids welcome flash for logged-in users)
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

  if (step === 'group') {
    return (
      <div className="screen onboarding-screen">
        <p className="eyebrow">Step 2 — Group</p>
        <h1>Join your group</h1>
        <p className="onboarding-sub">Enter the invite code a friend shared with you.</p>

        <div className="auth-form">
          <div className="field">
            <label className="field-label">Invite code</label>
            <input
              type="text"
              placeholder="e.g. SQUAD-AB3C"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn btn-primary"
            disabled={loading || !code.trim()}
            onClick={handleJoinGroup}
          >
            {loading ? 'Joining…' : 'Join group'}
          </button>

          <div className="divider" />

          <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={handleCreateGroup}
          >
            {loading ? 'Creating…' : 'Create a new group instead'}
          </button>
        </div>
      </div>
    )
  }

  // rules (final step)
  return (
    <div className="screen onboarding-screen">
      <p className="eyebrow">Step 3 — Rules</p>
      <h1>How points work</h1>

      {groupCode && (
        <div className="new-group-code">
          <p className="new-group-code-label">Your group's invite code</p>
          <p className="new-group-code-value">{groupCode}</p>
          <p className="new-group-code-hint">Share this with friends so they can join.</p>
        </div>
      )}

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
        Friends see your logs and points. Rankings update live. It's a game, not homework.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/', { replace: true })}>
        Start competing
      </button>
    </div>
  )
}
