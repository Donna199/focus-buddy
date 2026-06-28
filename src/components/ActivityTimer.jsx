import { useState, useEffect, useRef } from 'react'
import { calculateGoodOrBadPoints } from '../data/activities'

const PRESETS = [10, 25, 50]
const R = 80
const CIRC = 2 * Math.PI * R

export default function ActivityTimer({ activity, category, onComplete }) {
  const [phase, setPhase] = useState('setup') // 'setup' | 'running' | 'paused'
  const [targetSecs, setTargetSecs] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [custom, setCustom] = useState('')

  // Stable ref so effects never capture a stale onComplete
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // Countdown tick
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Natural completion — parent unmounts us, so don't touch local state
  useEffect(() => {
    if (phase === 'running' && targetSecs > 0 && elapsed >= targetSecs) {
      onCompleteRef.current(Math.round(targetSecs / 60))
    }
  }, [elapsed, phase, targetSecs])

  function start(mins) {
    setTargetSecs(mins * 60)
    setElapsed(0)
    setPhase('running')
  }

  function handleEnd() {
    onCompleteRef.current(Math.max(1, Math.round(elapsed / 60)))
  }

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="timer-setup">
        <p className="timer-setup-label">How long?</p>
        <div className="timer-presets">
          {PRESETS.map(p => (
            <button key={p} className="timer-preset-btn" onClick={() => start(p)}>
              {p} min
            </button>
          ))}
        </div>
        <div className="timer-custom-row">
          <input
            type="number"
            className="timer-custom-input"
            placeholder="Custom min"
            min="1"
            max="600"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            inputMode="numeric"
          />
          <button
            className="timer-preset-btn timer-start-btn"
            disabled={!custom || Number(custom) < 1}
            onClick={() => start(Number(custom))}
          >
            Start
          </button>
        </div>
      </div>
    )
  }

  // ── Running / paused screen ──────────────────────────────────────────────────
  const remaining = Math.max(0, targetSecs - elapsed)
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const dashOffset = targetSecs > 0 ? CIRC * (elapsed / targetSecs) : 0
  const livePoints = calculateGoodOrBadPoints(activity, elapsed / 60)
  const accentColor = category === 'good' ? 'var(--good)' : 'var(--bad)'
  const ptsColor = livePoints >= 0 ? 'var(--good)' : 'var(--bad)'

  return (
    <div className="timer-running">
      <div className="timer-circle-wrap">
        <svg viewBox="0 0 200 200" width="180" height="180" aria-hidden="true">
          {/* track */}
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* progress — drains as time passes */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke={accentColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.95s linear' }}
          />
        </svg>
        <div className="timer-overlay">
          <span className="timer-time">
            {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
          </span>
          <span className="timer-pts" style={{ color: ptsColor }}>
            {livePoints > 0 ? '+' : ''}{livePoints} pts
          </span>
          {phase === 'paused' && <span className="timer-paused-badge">Paused</span>}
        </div>
      </div>

      <div className="timer-controls">
        <button
          className="btn btn-secondary"
          onClick={() => setPhase(p => p === 'running' ? 'paused' : 'running')}
        >
          {phase === 'running' ? 'Pause' : 'Resume'}
        </button>
        <button className="btn btn-ghost timer-end-btn" onClick={handleEnd}>
          End now
        </button>
      </div>
    </div>
  )
}
