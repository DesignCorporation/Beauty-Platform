import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthContext, usePermissions } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
export const ProtectedRoute = ({ children, requiredRole, requiredRoles, minimumRole, redirectTo = '/login', }) => {
    const { isAuthenticated, loading, user } = useAuthContext();
    const { hasRole, hasAnyRole, hasMinimumRole } = usePermissions();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    // 🔍 DEBUG: логируем состояние ProtectedRoute
    console.log('🛡️ ProtectedRoute check:', {
        path: location.pathname,
        isAuthenticated,
        loading,
        hasUser: !!user,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
    });
    // Показываем загрузку пока проверяем аутентификацию
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" }), _jsx("p", { className: "text-gray-600", children: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438..." })] }) }));
    }
    // Если не аутентифицирован, перенаправляем на логин
    if (!isAuthenticated) {
        const currentSalon = searchParams.get('salon') || user?.tenant?.slug;
        const loginUrl = currentSalon
            ? `${redirectTo}?salon=${currentSalon}&redirect=${encodeURIComponent(location.pathname + location.search)}`
            : `${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`;
        return _jsx(Navigate, { to: loginUrl, replace: true });
    }
    // Проверяем роли если они заданы
    let hasAccess = true;
    if (requiredRole && !hasRole(requiredRole)) {
        hasAccess = false;
    }
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
        hasAccess = false;
    }
    if (minimumRole && !hasMinimumRole(minimumRole)) {
        hasAccess = false;
    }
    // Если нет доступа, показываем страницу с ошибкой
    if (!hasAccess) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-4", children: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D" }), _jsx("p", { className: "text-gray-600 mb-6", children: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u044D\u0442\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B." }), _jsxs("p", { className: "text-sm text-gray-500", children: ["\u0412\u0430\u0448\u0430 \u0440\u043E\u043B\u044C: ", _jsx("span", { className: "font-medium", children: user?.role })] }), _jsx("button", { onClick: () => window.history.back(), className: "mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: "\u041D\u0430\u0437\u0430\u0434" })] }) }));
    }
    return _jsx(_Fragment, { children: children });
};
export const RoleBased = ({ children, requiredRole, requiredRoles, minimumRole, fallback = null, }) => {
    const { hasRole, hasAnyRole, hasMinimumRole } = usePermissions();
    let hasAccess = true;
    if (requiredRole && !hasRole(requiredRole)) {
        hasAccess = false;
    }
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
        hasAccess = false;
    }
    if (minimumRole && !hasMinimumRole(minimumRole)) {
        hasAccess = false;
    }
    return hasAccess ? _jsx(_Fragment, { children: children }) : _jsx(_Fragment, { children: fallback });
};
