import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState, User } from '../hooks/useAuth';

interface AuthContextType extends AuthState {
  login: (credentials: {
    email: string;
    password: string;
    tenantSlug?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Хук для получения tenant-специфичных данных
export const useTenant = () => {
  const { user, isAuthenticated } = useAuthContext();
  
  // ✅ РЕАЛЬНАЯ АУТЕНТИФИКАЦИЯ: используем реальные данные пользователя
  return {
    salonId: user?.tenantId || null,
    tenantId: user?.tenantId || null,
    token: null, // Токены теперь в httpOnly cookies
    isAuthenticated, // ✅ ИСПРАВЛЕНО: реальный статус аутентификации
    tenantSlug: user?.tenant?.slug || null,
    tenantName: user?.tenant?.name || 'Beauty CRM',
    tenantStatus: user?.tenant?.status || 'INACTIVE',
    role: user?.role || null,
  };
};

// Хук для проверки ролей и permissions
export const usePermissions = () => {
  const { user } = useAuthContext();
  
  const hasRole = (requiredRole: string): boolean => {
    return user?.role === requiredRole;
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };
  
  // Иерархия ролей для проверки доступа
  const roleHierarchy = {
    'SUPER_ADMIN': 7,
    'SALON_OWNER': 6,
    'MANAGER': 5,
    'STAFF_MEMBER': 4,
    'RECEPTIONIST': 3,
    'ACCOUNTANT': 2,
    'CLIENT': 1,
  } as const;
  
  const hasMinimumRole = (minimumRole: string): boolean => {
    if (!user) return false;
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[minimumRole as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  };
  
  return {
    role: user?.role || null,
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    isOwner: hasRole('SALON_OWNER'),
    isManager: hasAnyRole(['SALON_OWNER', 'MANAGER']),
    isStaff: hasAnyRole(['SALON_OWNER', 'MANAGER', 'STAFF_MEMBER']),
    canManageAppointments: hasAnyRole(['SALON_OWNER', 'MANAGER', 'STAFF_MEMBER', 'RECEPTIONIST']),
    canViewReports: hasAnyRole(['SALON_OWNER', 'MANAGER', 'ACCOUNTANT']),
  };
};