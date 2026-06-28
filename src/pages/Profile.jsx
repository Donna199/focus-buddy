import { useState } from 'react'
import { MOCK_LOGS, CURRENT_USER, getTodayStats } from '../data/mockData'

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

// Your shareable friend code. In demo mode it's fixed; with the backend it
// would be generated per user and stored on the users table.
const MY_FRIEND_CODE = 'FOCUS-7K2M'

export default function Profile() {
  const stats = getTodayStats(CURRENT_USER.id)
  const myLogs = MOCK_LOGS.filter((l) => l.userId === CURRENT_USER.id)
  const totalLogs = myLogs.length

  const [copied, setCopied] = useState(false)
  const [friendCode, setFriendCode] = useState('')
  const [addedMsg, setAddedMsg] = useState('')

  function copyCode() {
    navigator.clipboard?.writeText(MY_FRIEND_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function shareCode() {
    const text = `Add me on Focus Buddy! My code is ${MY_FRIEND_CODE}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      copyCode()
    }
  }

  function addFriend() {
    const code = friendCode.trim().toUpperCase()
    if (!code) return
    // Demo only — no real connection yet. With the backend, this looks up the
    // user by code and creates a friendship / adds them to your group.
    setAddedMsg(`Request sent to ${code}. (Connects for real once the backend is live.)`)
    setFriendCode('')
    setTimeout(() => setAddedMsg(''), 3500)
  }

  return (
    <div className="screen profile-screen">
      <div className="profile-header">
        <span className="avatar-lg">{CURRENT_USER.avatar}</span>
        <h1>{CURRENT_USER.name}</h1>
        <p className="profile-group">The Squad · 5 members</p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{stats.totalPoints > 0 ? '+' : ''}{stats.totalPoints}</span>
          <span className="profile-stat-label">Points today</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{formatMinutes(stats.focusMinutes)}</span>
          <span className="profile-stat-label">Focus today</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{totalLogs}</span>
          <span className="profile-stat-label">Total logs</span>
        </div>
      </div>

      <div className="friends-section">
        <h2 className="friends-heading">Add friends</h2>

        <div className="friend-code-card">
          <p className="friend-code-label">Your code</p>
          <p className="friend-code-value">{MY_FRIEND_CODE}</p>
          <div className="friend-code-actions">
            <button className="btn btn-secondary friend-code-btn" onClick={copyCode}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button className="btn btn-primary friend-code-btn" onClick={shareCode}>
              Share
            </button>
          </div>
        </div>

        <div className="add-friend-row">
          <input
            type="text"
            placeholder="Enter a friend's code"
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
          />
          <button className="btn btn-primary add-friend-btn" disabled={!friendCode.trim()} onClick={addFriend}>
            Add
          </button>
        </div>
        {addedMsg && <p className="add-friend-msg">{addedMsg}</p>}
      </div>

      <div className="settings-list">
        <button className="settings-row">
          <span>Edit name & avatar</span>
          <span className="settings-arrow">→</span>
        </button>
        <button className="settings-row">
          <span>Invite code</span>
          <span className="settings-arrow">SQUAD-2026</span>
        </button>
        <button className="settings-row">
          <span>My activity history</span>
          <span className="settings-arrow">→</span>
        </button>
        <button className="settings-row">
          <span>Privacy</span>
          <span className="settings-arrow">→</span>
        </button>
        <button className="settings-row danger">
          <span>Leave group</span>
          <span className="settings-arrow">→</span>
        </button>
      </div>

      <p className="demo-note">
        Demo mode — running on sample data. Connect Supabase to make this real.
      </p>
    </div>
  )
}
