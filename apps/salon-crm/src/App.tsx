import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentFormPage from './pages/AppointmentFormPage';
import ServicesPage from './pages/ServicesPage';
import CreateServicePage from './pages/CreateServicePage';
import EditServicePage from './pages/EditServicePage';
import ClientsPage from './pages/ClientsPage';
import CreateClientPage from './pages/CreateClientPage';
import EditClientPage from './pages/EditClientPage';
import TeamPage from './pages/TeamPage';
import StaffProfilePage from './pages/StaffProfilePage';
import InviteStaffPage from './pages/InviteStaffPage';
import PaymentsPage from './pages/PaymentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import MultiStepRegistration from './components/registration/MultiStepRegistration';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          {/* Вход и регистрация без layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/:step" element={<MultiStepRegistration />} />
          <Route path="/register" element={<Navigate to="/register/owner" replace />} />
          
          {/* Основное приложение с layout - требует аутентификации */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><DashboardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppLayout><CalendarPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <AppLayout><AppointmentsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments/new" element={
            <ProtectedRoute>
              <AppLayout><AppointmentFormPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments/:id" element={
            <ProtectedRoute>
              <AppLayout><AppointmentFormPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments/:id/edit" element={
            <ProtectedRoute>
              <AppLayout><AppointmentFormPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/services" element={
            <ProtectedRoute>
              <AppLayout><ServicesPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/services/create" element={
            <ProtectedRoute>
              <AppLayout><CreateServicePage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/services/:id/edit" element={
            <ProtectedRoute>
              <AppLayout><EditServicePage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <AppLayout><ClientsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients/create" element={
            <ProtectedRoute>
              <AppLayout><CreateClientPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:id/edit" element={
            <ProtectedRoute>
              <AppLayout><EditClientPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <AppLayout><TeamPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/team/:id" element={
            <ProtectedRoute>
              <AppLayout><StaffProfilePage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/team/invite" element={
            <ProtectedRoute requiredRoles={['SALON_OWNER', 'MANAGER']}>
              <AppLayout><InviteStaffPage /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Страницы с проверкой ролей */}
          <Route path="/payments" element={
            <ProtectedRoute requiredRoles={['SALON_OWNER', 'MANAGER', 'ACCOUNTANT']}>
              <AppLayout><PaymentsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute requiredRoles={['SALON_OWNER', 'MANAGER']}>
              <AppLayout><AnalyticsPage /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Заглушки для настроек и помощи */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-3xl font-bold">Настройки</h1>
                  <p className="text-gray-600 mt-2">Раздел в разработке</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-3xl font-bold">Помощь</h1>
                  <p className="text-gray-600 mt-2">Раздел в разработке</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Fallback для всех неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App
