import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const auth = useAuth();
    return (_jsx(AuthContext.Provider, { value: auth, children: children }));
};
export const useAuthContext = () => {
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
    const hasRole = (requiredRole) => {
        return user?.role === requiredRole;
    };
    const hasAnyRole = (roles) => {
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
    };
    const hasMinimumRole = (minimumRole) => {
        if (!user)
            return false;
        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[minimumRole] || 0;
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
