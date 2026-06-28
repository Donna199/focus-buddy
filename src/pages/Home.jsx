import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserTodayStats, getGroupRanking, getGroupLogs } from '../lib/db'
import LogCard from '../components/LogCard'

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function Home() {
  const { userProfile } = useAuth()
  const [stats, setStats]     = useState({ totalPoints: 0, focusMinutes: 0, badMinutes: 0 })
  const [ranking, setRanking] = useState([])
  const [myLogs, setMyLogs]   = useState([])

  useEffect(() => {
    if (!userProfile?.id || !userProfile?.group_id) return

    function fetchData() {
      Promise.all([
        getUserTodayStats(userProfile.id, userProfile.group_id),
        getGroupRanking(userProfile.group_id),
        getGroupLogs(userProfile.group_id),
      ]).then(([s, r, logs]) => {
        setStats(s)
        const sorted = [...r].sort((a, b) => b.totalPoints - a.totalPoints)
        setRanking(sorted)
        setMyLogs(logs.filter(l => l.userId === userProfile.id).slice(0, 3))
      }).catch(console.error)
    }

    fetchData()

    const onVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userProfile])

  const myRank = ranking.findIndex(r => r.id === userProfile?.id) + 1

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <div>
          <p className="eyebrow">Today</p>
          <h1>Hey, {userProfile?.name?.split(' ')[0] || 'there'} 👋</h1>
        </div>
      </div>

      <div className="card points-hero">
        <p className="points-hero-label">Points</p>
        <p className="points-hero-value">{stats.totalPoints > 0 ? '+' : ''}{stats.totalPoints}</p>

        <div className="points-hero-sub">
          <div className="hero-sub-item">
            <span className="hero-sub-value">
              #{myRank || '—'}<span className="hero-sub-suffix">/{ranking.length || '—'}</span>
            </span>
            <span className="hero-sub-label">Rank</span>
          </div>
          <div className="hero-sub-divider" />
          <div className="hero-sub-item">
            <span className="hero-sub-value">{formatMinutes(stats.focusMinutes)}</span>
            <span className="hero-sub-label">Focus</span>
          </div>
          <div className="hero-sub-divider" />
          <div className="hero-sub-item">
            <span className="hero-sub-value" style={{ color: 'var(--bad)' }}>{formatMinutes(stats.badMinutes)}</span>
            <span className="hero-sub-label">Bad time</span>
          </div>
        </div>
      </div>

      <Link to="/log" className="btn btn-primary log-cta">
        + Log an activity
      </Link>

      <div className="section-header">
        <h2>Recent logs</h2>
        <Link to="/feed" className="see-all">See all</Link>
      </div>
      <div className="log-list">
        {myLogs.length === 0 ? (
          <p className="empty-state">No logs yet today. Log your first activity above.</p>
        ) : (
          myLogs.map(log => <LogCard key={log.id} log={log} showUser={false} />)
        )}
      </div>
    </div>
  )
}
