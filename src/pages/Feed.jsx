import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CURRENT_USER } from '../data/mockData'
import { getAllLogs, subscribe } from '../data/logStore'
import LogCard from '../components/LogCard'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'good', label: 'Good' },
  { id: 'bad', label: 'Bad' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'mine', label: 'My logs' },
]

export default function Feed() {
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [, forceUpdate] = useState(0)

  // Re-render when a new log is added during this session.
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), [])

  // Show a success toast if we just came from logging
  useEffect(() => {
    if (location.state?.justLogged) {
      const pts = location.state.points
      setToast(pts >= 0 ? `Nice. +${pts} points logged.` : `Logged. ${pts} points — reset and climb back.`)
      const timer = setTimeout(() => setToast(null), 3000)
      window.history.replaceState({}, '')
      return () => clearTimeout(timer)
    }
  }, [location.state])

  const sortedLogs = [...getAllLogs()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const filteredLogs = sortedLogs.filter((log) => {
    if (filter === 'all') return true
    if (filter === 'mine') return log.userId === CURRENT_USER.id
    return log.category === filter
  })

  return (
    <div className="screen feed-screen">
      <h1>Feed</h1>

      <div className="feed-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-pill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="log-list">
        {filteredLogs.length === 0 ? (
          <p className="empty-state">No logs here yet. Be the first to log something.</p>
        ) : (
          filteredLogs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
