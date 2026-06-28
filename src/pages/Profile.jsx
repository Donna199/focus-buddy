import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserTodayStats, getTotalLogCount, addFriend } from '../lib/db'
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
  const [stats, setStats]         = useState({ totalPoints: 0, focusMinutes: 0 })
  const [totalLogs, setTotalLogs] = useState(0)
  const [copied, setCopied]       = useState(false)
  const [friendInput, setFriendInput] = useState('')
  const [friendLoading, setFriendLoading] = useState(false)
  const [friendMsg, setFriendMsg] = useState({ text: '', ok: true })

  const myCode = userProfile?.friend_code ?? '—'

  useEffect(() => {
    if (!userProfile?.id) return
    Promise.all([
      getUserTodayStats(userProfile.id),
      getTotalLogCount(userProfile.id),
    ]).then(([s, count]) => {
      setStats(s)
      setTotalLogs(count)
    }).catch(console.error)
  }, [userProfile])

  function copyCode() {
    navigator.clipboard?.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function shareCode() {
    const text = `Add me on Focus Buddy! My code is ${myCode}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      copyCode()
    }
  }

  async function handleAddFriend() {
    if (!friendInput.trim() || !userProfile?.id) return
    setFriendLoading(true)
    setFriendMsg({ text: '', ok: true })
    try {
      const friend = await addFriend(userProfile.id, friendInput)
      setFriendMsg({ text: `${friend.name} added! You'll see each other's activity now.`, ok: true })
      setFriendInput('')
    } catch (err) {
      setFriendMsg({ text: err.message, ok: false })
    } finally {
      setFriendLoading(false)
    }
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
        <h2 className="friends-heading">Friends</h2>

        <div className="friend-code-card">
          <p className="friend-code-label">Your friend code</p>
          <p className="friend-code-value">{myCode}</p>
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
            placeholder="Enter a friend's code (FOCUS-XXXX)"
            value={friendInput}
            onChange={e => setFriendInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
          />
          <button
            className="btn btn-primary add-friend-btn"
            disabled={friendLoading || !friendInput.trim()}
            onClick={handleAddFriend}
          >
            {friendLoading ? '…' : 'Add'}
          </button>
        </div>
        {friendMsg.text && (
          <p className="add-friend-msg" style={{ color: friendMsg.ok ? 'var(--good)' : 'var(--bad)' }}>
            {friendMsg.text}
          </p>
        )}
      </div>

      <div className="settings-list">
        <button className="settings-row">
          <span>Email</span>
          <span className="settings-arrow" style={{ fontSize: 12, opacity: 0.6 }}>{session?.user?.email ?? ''}</span>
        </button>
        <button className="settings-row danger" onClick={handleSignOut}>
          <span>Sign out</span>
          <span className="settings-arrow">→</span>
        </button>
      </div>
    </div>
  )
}
