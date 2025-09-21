import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthContext, usePermissions } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  minimumRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  minimumRole,
  redirectTo = '/login',
}) => {
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Проверка аутентификации...</p>
        </div>
      </div>
    );
  }

  // Если не аутентифицирован, перенаправляем на логин
  if (!isAuthenticated) {
    const currentSalon = searchParams.get('salon') || user?.tenant?.slug;
    const loginUrl = currentSalon 
      ? `${redirectTo}?salon=${currentSalon}&redirect=${encodeURIComponent(location.pathname + location.search)}`
      : `${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    
    return <Navigate to={loginUrl} replace />;
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 mb-6">
            У вас недостаточно прав для просмотра этой страницы.
          </p>
          <p className="text-sm text-gray-500">
            Ваша роль: <span className="font-medium">{user?.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Компонент для условного рендеринга на основе ролей
interface RoleBasedProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  minimumRole?: string;
  fallback?: React.ReactNode;
}

export const RoleBased: React.FC<RoleBasedProps> = ({
  children,
  requiredRole,
  requiredRoles,
  minimumRole,
  fallback = null,
}) => {
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

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};