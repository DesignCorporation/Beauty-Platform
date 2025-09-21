import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(Router, { children: _jsx(AuthProvider, { children: _jsx(ToastProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register/:step", element: _jsx(MultiStepRegistration, {}) }), _jsx(Route, { path: "/register", element: _jsx(Navigate, { to: "/register/owner", replace: true }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(DashboardPage, {}) }) }) }), _jsx(Route, { path: "/calendar", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(CalendarPage, {}) }) }) }), _jsx(Route, { path: "/appointments", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(AppointmentsPage, {}) }) }) }), _jsx(Route, { path: "/appointments/new", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(AppointmentFormPage, {}) }) }) }), _jsx(Route, { path: "/appointments/:id", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(AppointmentFormPage, {}) }) }) }), _jsx(Route, { path: "/appointments/:id/edit", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(AppointmentFormPage, {}) }) }) }), _jsx(Route, { path: "/services", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(ServicesPage, {}) }) }) }), _jsx(Route, { path: "/services/create", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(CreateServicePage, {}) }) }) }), _jsx(Route, { path: "/services/:id/edit", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(EditServicePage, {}) }) }) }), _jsx(Route, { path: "/clients", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(ClientsPage, {}) }) }) }), _jsx(Route, { path: "/clients/create", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(CreateClientPage, {}) }) }) }), _jsx(Route, { path: "/clients/:id/edit", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(EditClientPage, {}) }) }) }), _jsx(Route, { path: "/team", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(TeamPage, {}) }) }) }), _jsx(Route, { path: "/team/:id", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(StaffProfilePage, {}) }) }) }), _jsx(Route, { path: "/team/invite", element: _jsx(ProtectedRoute, { requiredRoles: ['SALON_OWNER', 'MANAGER'], children: _jsx(AppLayout, { children: _jsx(InviteStaffPage, {}) }) }) }), _jsx(Route, { path: "/payments", element: _jsx(ProtectedRoute, { requiredRoles: ['SALON_OWNER', 'MANAGER', 'ACCOUNTANT'], children: _jsx(AppLayout, { children: _jsx(PaymentsPage, {}) }) }) }), _jsx(Route, { path: "/analytics", element: _jsx(ProtectedRoute, { requiredRoles: ['SALON_OWNER', 'MANAGER'], children: _jsx(AppLayout, { children: _jsx(AnalyticsPage, {}) }) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsx("p", { className: "text-gray-600 mt-2", children: "\u0420\u0430\u0437\u0434\u0435\u043B \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435" })] }) }) }) }), _jsx(Route, { path: "/help", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\u041F\u043E\u043C\u043E\u0449\u044C" }), _jsx("p", { className: "text-gray-600 mt-2", children: "\u0420\u0430\u0437\u0434\u0435\u043B \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435" })] }) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }) }) }));
}
export default App;
