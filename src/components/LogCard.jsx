import { MOCK_USERS } from '../data/mockData'

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const pillClass = { good: 'positive', bad: 'negative', bonus: 'bonus' }

export default function LogCard({ log, showUser = true }) {
  // Prefer embedded user info from Supabase join; fall back to mock list for demo mode
  const fallback = MOCK_USERS.find((u) => u.id === log.userId)
  const userName   = log.userName   ?? fallback?.name   ?? 'Someone'
  const userAvatar = log.userAvatar ?? fallback?.avatar ?? '?'
  const pointsLabel = log.points > 0 ? `+${log.points}` : `${log.points}`

  return (
    <div className="log-card">
      <div className="log-card-top">
        {showUser && (
          <div className="log-user">
            <span className="avatar-sm">{userAvatar}</span>
            <span className="log-user-name">{userName}</span>
          </div>
        )}
        <span className="log-time">{timeAgo(log.createdAt)}</span>
      </div>

      <div className="log-card-mid">
        <div>
          <p className="log-activity">{log.activityName}</p>
          {log.durationMinutes && (
            <p className="log-duration">{log.durationMinutes} min{log.trigger ? ` · felt ${log.trigger.toLowerCase()}` : ''}</p>
          )}
        </div>
        <span className={`point-pill ${pillClass[log.category]}`}>{pointsLabel}</span>
      </div>

      {log.caption && <p className="log-caption">{log.caption}</p>}

      {log.photo && (
        <div className="log-photo">
          <img src={log.photo} alt={log.activityName} loading="lazy" />
        </div>
      )}
    </div>
  )
}
