import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthGuard({ children }) {
  const { session, userProfile } = useAuth()

  // Still resolving session — show nothing to avoid flash
  if (session === undefined) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/welcome" replace />

  return children
}
