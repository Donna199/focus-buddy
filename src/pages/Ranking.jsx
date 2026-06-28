import { useState, useEffect } from 'react'
import { getRanking, CURRENT_USER } from '../data/mockData'
import { getAllLogs, subscribe } from '../data/logStore'

const RANK_TYPES = [
  { id: 'totalPoints', label: 'Points', format: (v) => `${v > 0 ? '+' : ''}${v}` },
  { id: 'focusMinutes', label: 'Focus time', format: (v) => formatMinutes(v) },
  { id: 'badMinutes', label: 'Least bad time', format: (v) => formatMinutes(v), ascending: true },
]

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function Ranking() {
  const [rankType, setRankType] = useState('totalPoints')
  const [, forceUpdate] = useState(0)
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), [])
  const activeType = RANK_TYPES.find((t) => t.id === rankType)

  let ranked = getRanking(getAllLogs())
  ranked = [...ranked].sort((a, b) =>
    activeType.ascending ? a[rankType] - b[rankType] : b[rankType] - a[rankType]
  )

  return (
    <div className="screen ranking-screen">
      <h1>Ranking</h1>
      <p className="ranking-sub">Today · your friend group</p>

      <div className="rank-type-tabs">
        {RANK_TYPES.map((t) => (
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
          const isMe = user.id === CURRENT_USER.id
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
      </div>
    </div>
  )
}
