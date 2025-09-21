import { useEffect, useRef } from 'react';
import { User, Settings, Lock, LogOut } from 'lucide-react';
import apiClient from '../utils/api-client';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDropdown({ isOpen, onClose }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Получаем данные пользователя из localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
      icon: <User className="h-4 w-4" />,
      action: () => {
        // TODO: Implement profile page
        console.log('Переход в профиль');
        onClose();
      }
    },
    {
      label: 'Настройки салона',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        // TODO: Implement settings page
        console.log('Переход в настройки');
        onClose();
      }
    },
    {
      label: 'Изменить пароль',
      icon: <Lock className="h-4 w-4" />,
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
      } catch (error) {
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
    } catch (error) {
      console.error('Logout error:', error);
      // В случае ошибки всё равно очищаем данные и редиректим
      apiClient.reset();
      localStorage.clear();
      window.location.href = '/login';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-50"
    >
      {/* User Info Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-100"
          >
            <span className="text-sm font-medium text-indigo-700">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || 'Пользователь'
              }
            </p>
            <p className="text-sm text-gray-500 capitalize">
              {user?.role?.replace('_', ' ').toLowerCase() || 'Пользователь'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-gray-700"
          >
            <div className="text-gray-400">
              {item.icon}
            </div>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Выйти из системы</span>
        </button>
      </div>
    </div>
  );
}