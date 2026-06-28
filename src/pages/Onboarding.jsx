import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState('welcome')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  function finish() {
    // In demo mode this just enters the app. When Supabase is connected,
    // this is where you'd create the user row and link them to the group.
    navigate('/')
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
          <button className="btn btn-primary" onClick={() => setStep('name')}>Get started</button>
          <button className="btn btn-ghost" onClick={() => setStep('name')}>I have an account</button>
        </div>
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className="screen onboarding-screen">
        <p className="eyebrow">Step 1 of 3</p>
        <h1>What's your name?</h1>
        <p className="onboarding-sub">This is how friends see you on the feed.</p>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          style={{ marginTop: 20, marginBottom: 24 }}
        />
        <button className="btn btn-primary" disabled={!name.trim()} onClick={() => setStep('group')}>
          Continue
        </button>
      </div>
    )
  }

  if (step === 'group') {
    return (
      <div className="screen onboarding-screen">
        <p className="eyebrow">Step 2 of 3</p>
        <h1>Join your group</h1>
        <p className="onboarding-sub">Enter the invite code a friend shared with you.</p>
        <input
          type="text"
          placeholder="e.g. SQUAD-2026"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoFocus
          style={{ marginTop: 20, marginBottom: 16 }}
        />
        <button className="btn btn-primary" disabled={!code.trim()} onClick={() => setStep('rules')}>
          Join group
        </button>
        <div className="divider" />
        <button className="btn btn-secondary" onClick={() => setStep('rules')}>
          Create a new group instead
        </button>
      </div>
    )
  }

  // rules
  return (
    <div className="screen onboarding-screen">
      <p className="eyebrow">Step 3 of 3</p>
      <h1>How points work</h1>
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
      <button className="btn btn-primary" onClick={finish}>Start competing</button>
    </div>
  )
}
