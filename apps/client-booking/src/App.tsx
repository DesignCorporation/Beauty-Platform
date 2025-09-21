import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CSRFTestPage from './pages/CSRFTestPage'

export default function App() {
  const { i18n } = useTranslation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    // Простая проверка наличия куки (можно улучшить)
    const hasAuthCookie = document.cookie.includes('beauty_client_access_token')
    setIsAuthenticated(hasAuthCookie)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    // Дополнительно можно сохранить состояние в localStorage
    localStorage.setItem('clientAuthenticated', 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('clientAuthenticated')
    // Перенаправляем на страницу входа
    window.location.href = '/login'
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={<LoginPage onLogin={handleLogin} />} 
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? <DashboardPage onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />
            } 
          />
          <Route path="/csrf-test" element={<CSRFTestPage />} />
        </Routes>
      </div>
    </Router>
  )
}