import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/AuthGuard'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Log from './pages/Log'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'

function AppShell() {
  const location = useLocation()
  const hideNav = location.pathname === '/welcome'

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
        <Route path="/log" element={<AuthGuard><Log /></AuthGuard>} />
        <Route path="/ranking" element={<AuthGuard><Ranking /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
