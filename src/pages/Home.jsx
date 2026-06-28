import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CURRENT_USER, getTodayStats, getRanking } from '../data/mockData'
import { getAllLogs, subscribe } from '../data/logStore'
import LogCard from '../components/LogCard'

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function Home() {
  const [, forceUpdate] = useState(0)
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), [])

  const logs = getAllLogs()
  const stats = getTodayStats(CURRENT_USER.id, logs)
  const ranking = getRanking(logs)
  const myRank = ranking.findIndex((r) => r.id === CURRENT_USER.id) + 1
  const myLogs = logs.filter((l) => l.userId === CURRENT_USER.id).slice(0, 3)

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <p className="eyebrow">Today</p>
        <h1>Hey, {CURRENT_USER.name === 'You' ? 'there' : CURRENT_USER.name} 👋</h1>
      </div>

      <div className="card points-hero">
        <p className="points-hero-label">Points</p>
        <p className="points-hero-value">{stats.totalPoints > 0 ? '+' : ''}{stats.totalPoints}</p>

        <div className="points-hero-sub">
          <div className="hero-sub-item">
            <span className="hero-sub-value">#{myRank}<span className="hero-sub-suffix">/{ranking.length}</span></span>
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
          myLogs.map((log) => <LogCard key={log.id} log={log} showUser={false} />)
        )}
      </div>
    </div>
  )
}
