import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

import './index.css'
import './components/BottomNav.css'
import './components/LogCard.css'
import './components/ResetPrompt.css'
import './pages/Home.css'
import './pages/Log.css'
import './pages/Feed.css'
import './pages/Ranking.css'
import './pages/Profile.css'
import './pages/Onboarding.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
