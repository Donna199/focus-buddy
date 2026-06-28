import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getGroupRanking } from '../lib/db'

const RANK_TYPES = [
  { id: 'totalPoints',  label: 'Points',         format: v => `${v > 0 ? '+' : ''}${v}` },
  { id: 'focusMinutes', label: 'Focus time',      format: v => formatMinutes(v) },
  { id: 'badMinutes',   label: 'Least bad time',  format: v => formatMinutes(v), ascending: true },
]

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function Ranking() {
  const { userProfile } = useAuth()
  const [rawRanking, setRawRanking] = useState([])
  const [rankType, setRankType]     = useState('totalPoints')

  useEffect(() => {
    if (!userProfile?.group_id) return
    getGroupRanking(userProfile.group_id).then(setRawRanking).catch(console.error)
  }, [userProfile])

  const activeType = RANK_TYPES.find(t => t.id === rankType)
  const ranked = [...rawRanking].sort((a, b) =>
    activeType.ascending ? a[rankType] - b[rankType] : b[rankType] - a[rankType]
  )

  return (
    <div className="screen ranking-screen">
      <h1>Ranking</h1>
      <p className="ranking-sub">Today · your friend group</p>

      <div className="rank-type-tabs">
        {RANK_TYPES.map(t => (
          <button
            key={t.id}
            className={`rank-tab ${rankType === t.id ? 'active' : ''}`}
            onClick={() => setRankType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rank-list">
        {ranked.map((user, index) => {
          const isMe    = user.id === userProfile?.id
          const isPodium = index < 3
          return (
            <div key={user.id} className={`rank-row ${isMe ? 'is-me' : ''} ${isPodium ? 'podium' : ''}`}>
              <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
              <span className="avatar-sm rank-avatar">{user.avatar}</span>
              <div className="rank-info">
                <span className="rank-name">{user.name}{isMe ? ' (you)' : ''}</span>
                <span className="rank-secondary">
                  {formatMinutes(user.focusMinutes)} focus · {formatMinutes(user.badMinutes)} bad
                </span>
              </div>
              <span className="rank-value">{activeType.format(user[rankType])}</span>
            </div>
          )
        })}
        {ranked.length === 0 && (
          <p className="empty-state">No activity yet today. Be first to log something.</p>
        )}
      </div>
    </div>
  )
}
