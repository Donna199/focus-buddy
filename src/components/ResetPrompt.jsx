import { useState } from 'react'

const RESETS = [
  { id: 'breathing', name: '2-minute breathing', instruction: 'Breathe in for 4 seconds, hold for 2, breathe out for 6. Repeat for 2 minutes.' },
  { id: 'urge_surf', name: 'Urge surfing', instruction: 'Notice the urge to scroll. Don\u2019t fight it. Watch it rise and fall like a wave for 2 minutes, then pick one small replacement action.' },
  { id: 'walk', name: '5-minute no-phone walk', instruction: 'Put your phone away and walk for 5 minutes \u2014 no music, no podcast.' },
  { id: 'thought_check', name: 'Thought check', instruction: 'Answer three questions: What was I feeling before I started? What was I avoiding? What\u2019s one better action for the next 5 minutes?' },
  { id: 'focus', name: 'Start a 10-minute focus session', instruction: 'Pick one simple task. Set a 10-minute timer. Phone away. Work only on that.' },
  { id: 'shutdown', name: 'Bedtime shutdown', instruction: 'Put your phone away from the bed. Write one sentence about tomorrow\u2019s first task.' },
]

export default function ResetPrompt({ points, trigger, onDone }) {
  const [chosen, setChosen] = useState(null)

  if (chosen) {
    return (
      <div className="screen reset-screen">
        <div className="reset-exercise">
          <p className="eyebrow">Reset</p>
          <h1>{chosen.name}</h1>
          <p className="reset-instruction">{chosen.instruction}</p>
          <button className="btn btn-primary" onClick={onDone}>Done — back to feed</button>
          <button className="btn btn-ghost" onClick={onDone}>Skip</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen reset-screen">
      <div className="reset-header">
        <span className="point-pill negative reset-points">{points} pts</span>
        <h1>You lost points from that scroll.</h1>
        <p className="reset-sub">
          {trigger ? `Felt ${trigger.toLowerCase()}? ` : ''}No shame — reset and climb back. Pick one:
        </p>
      </div>

      <div className="reset-options">
        {RESETS.map((r) => (
          <button key={r.id} className="reset-option" onClick={() => setChosen(r)}>
            <span className="reset-option-name">{r.name}</span>
            <span className="reset-arrow">→</span>
          </button>
        ))}
      </div>

      <button className="btn btn-ghost" onClick={onDone}>Skip for now</button>
    </div>
  )
}
