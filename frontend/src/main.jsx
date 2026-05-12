import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import './responsive.css'
import './styles/auth.css'
import AppRouter from './AppRouter'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Router>
  </StrictMode>,
)
