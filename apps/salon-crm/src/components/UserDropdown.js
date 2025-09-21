import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { User, Settings, Lock, LogOut } from 'lucide-react';
import apiClient from '../utils/api-client';
export default function UserDropdown({ isOpen, onClose }) {
    const dropdownRef = useRef(null);
    // Получаем данные пользователя из localStorage
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);
    const menuItems = [
        {
            label: 'Профиль пользователя',
            icon: _jsx(User, { className: "h-4 w-4" }),
            action: () => {
                // TODO: Implement profile page
                console.log('Переход в профиль');
                onClose();
            }
        },
        {
            label: 'Настройки салона',
            icon: _jsx(Settings, { className: "h-4 w-4" }),
            action: () => {
                // TODO: Implement settings page
                console.log('Переход в настройки');
                onClose();
            }
        },
        {
            label: 'Изменить пароль',
            icon: _jsx(Lock, { className: "h-4 w-4" }),
            action: () => {
                // TODO: Implement change password
                console.log('Изменение пароля');
                onClose();
            }
        }
    ];
    const handleLogout = async () => {
        try {
            // Вызов API logout для инвалидации refresh token
            try {
                await apiClient.post('/logout', {
                    refreshToken: localStorage.getItem('refreshToken') || ''
                });
            }
            catch (error) {
                console.warn('Logout API call failed:', error);
            }
            // Сброс состояния API клиента
            apiClient.reset();
            // Очистка локального хранилища
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('salonLoginData');
            // Перенаправление на страницу входа
            window.location.href = '/login';
        }
        catch (error) {
            console.error('Logout error:', error);
            // В случае ошибки всё равно очищаем данные и редиректим
            apiClient.reset();
            localStorage.clear();
            window.location.href = '/login';
        }
        onClose();
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { ref: dropdownRef, className: "absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-50", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-10 w-10 rounded-full flex items-center justify-center bg-indigo-100", children: _jsx("span", { className: "text-sm font-medium text-indigo-700", children: user?.firstName?.charAt(0)?.toUpperCase() || 'U' }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.email || 'Пользователь' }), _jsx("p", { className: "text-sm text-gray-500 capitalize", children: user?.role?.replace('_', ' ').toLowerCase() || 'Пользователь' })] })] }) }), _jsx("div", { className: "py-2", children: menuItems.map((item, index) => (_jsxs("button", { onClick: item.action, className: "w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-gray-700", children: [_jsx("div", { className: "text-gray-400", children: item.icon }), _jsx("span", { className: "text-sm", children: item.label })] }, index))) }), _jsx("div", { className: "border-t border-gray-200", children: _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors", children: [_jsx(LogOut, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm font-medium", children: "\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0441\u0438\u0441\u0442\u0435\u043C\u044B" })] }) })] }));
}
