import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import LoginForm from './components/LoginForm'
import MFAVerificationPage from './components/MFAVerificationPage'
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/mfa-verify" element={<MFAVerificationPage />} />
          
          {/* Защищенные маршруты - все остальное */}
          <Route 
            path="*" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App