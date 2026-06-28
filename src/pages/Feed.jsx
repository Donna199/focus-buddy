import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGroupLogs } from '../lib/db'
import LogCard from '../components/LogCard'

const FILTERS = [
  { id: 'all',   label: 'All' },
  { id: 'good',  label: 'Good' },
  { id: 'bad',   label: 'Bad' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'mine',  label: 'My logs' },
]

export default function Feed() {
  const { userProfile } = useAuth()
  const location = useLocation()
  const [logs, setLogs]     = useState([])
  const [filter, setFilter] = useState('all')
  const [toast, setToast]   = useState(null)

  useEffect(() => {
    if (!userProfile?.group_id) return

    function fetchData() {
      getGroupLogs(userProfile.group_id).then(setLogs).catch(console.error)
    }

    fetchData()

    const onVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userProfile])

  // Re-fetch when returning from Log screen so new entry is visible
  useEffect(() => {
    if (location.state?.justLogged && userProfile?.group_id) {
      getGroupLogs(userProfile.group_id).then(setLogs).catch(console.error)

      const pts = location.state.points
      setToast(pts >= 0
        ? `Nice. +${pts} points logged.`
        : `Logged. ${pts} points — reset and climb back.`)
      const timer = setTimeout(() => setToast(null), 3000)
      window.history.replaceState({}, '')
      return () => clearTimeout(timer)
    }
  }, [location.state, userProfile])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all')  return true
    if (filter === 'mine') return log.userId === userProfile?.id
    return log.category === filter
  })

  return (
    <div className="screen feed-screen">
      <div className="page-header">
        <h1>Feed</h1>
        <button className="refresh-btn" onClick={() => userProfile?.group_id && getGroupLogs(userProfile.group_id).then(setLogs).catch(console.error)}>↻</button>
      </div>

      <div className="feed-filters">
        {FILTERS.map(f => (
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
          filteredLogs.map(log => <LogCard key={log.id} log={log} />)
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
