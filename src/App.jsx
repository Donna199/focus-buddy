import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Log from './pages/Log'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'

export default function App() {
  const location = useLocation()
  const hideNav = location.pathname === '/welcome'

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/log" element={<Log />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}
