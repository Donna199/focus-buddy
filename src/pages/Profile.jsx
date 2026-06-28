import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserTodayStats, getTotalLogCount } from '../lib/db'
import { supabase } from '../lib/supabase'

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function Profile() {
  const navigate = useNavigate()
  const { userProfile, session } = useAuth()
  const [stats, setStats]       = useState({ totalPoints: 0, focusMinutes: 0 })
  const [totalLogs, setTotalLogs] = useState(0)
  const [copied, setCopied]     = useState(false)
  const [friendCode, setFriendCode] = useState('')
  const [addedMsg, setAddedMsg] = useState('')

  const groupInviteCode = userProfile?.groups?.invite_code ?? '—'

  useEffect(() => {
    if (!userProfile?.id || !userProfile?.group_id) return
    Promise.all([
      getUserTodayStats(userProfile.id, userProfile.group_id),
      getTotalLogCount(userProfile.id),
    ]).then(([s, count]) => {
      setStats(s)
      setTotalLogs(count)
    }).catch(console.error)
  }, [userProfile])

  function copyCode() {
    navigator.clipboard?.writeText(groupInviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function shareCode() {
    const text = `Add me on Focus Buddy! My group code is ${groupInviteCode}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      copyCode()
    }
  }

  function addFriend() {
    const code = friendCode.trim().toUpperCase()
    if (!code) return
    setAddedMsg(`Request sent to ${code}. (Connects for real once the backend is live.)`)
    setFriendCode('')
    setTimeout(() => setAddedMsg(''), 3500)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className="screen profile-screen">
      <div className="profile-header">
        <span className="avatar-lg">{userProfile?.avatar_letter ?? '?'}</span>
        <h1>{userProfile?.name ?? ''}</h1>
        <p className="profile-group">{userProfile?.groups?.name ?? 'No group'}</p>
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
        <h2 className="friends-heading">Invite friends</h2>

        <div className="friend-code-card">
          <p className="friend-code-label">Your group's code</p>
          <p className="friend-code-value">{groupInviteCode}</p>
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
            placeholder="Enter a friend's group code"
            value={friendCode}
            onChange={e => setFriendCode(e.target.value.toUpperCase())}
          />
          <button
            className="btn btn-primary add-friend-btn"
            disabled={!friendCode.trim()}
            onClick={addFriend}
          >
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
          <span>Email</span>
          <span className="settings-arrow" style={{ fontSize: 12, opacity: 0.6 }}>{session?.user?.email ?? ''}</span>
        </button>
        <button className="settings-row">
          <span>My activity history</span>
          <span className="settings-arrow">→</span>
        </button>
        <button className="settings-row">
          <span>Privacy</span>
          <span className="settings-arrow">→</span>
        </button>
        <button className="settings-row danger" onClick={handleSignOut}>
          <span>Sign out</span>
          <span className="settings-arrow">→</span>
        </button>
      </div>
    </div>
  )
}
