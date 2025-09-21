import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useDebugLogger, useEffectDebugger, useStateDebugger } from '../hooks/useDebugLogger';

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginError {
  message: string;
  code?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { login, isAuthenticated, loading } = useAuthContext();
  
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const salonSlug = searchParams.get('salon');
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  // 🔍 DEBUG: Отслеживаем рендеры LoginPage
  useDebugLogger('LoginPage', { 
    isAuthenticated, 
    loading, 
    isLoading, 
    salonSlug, 
    redirectTo,
    hasError: !!error 
  });
  
  // 🔍 DEBUG: Отслеживаем критические состояния
  useStateDebugger('LoginPage.isAuthenticated', isAuthenticated);
  useStateDebugger('LoginPage.loading', loading);
  useStateDebugger('LoginPage.error', error);

  // Перенаправляем если уже аутентифицирован ТОЛЬКО НА СТРАНИЦЕ ЛОГИНА
  useEffect(() => {
    console.log('🔍 LoginPage redirect effect:', { isAuthenticated, loading, redirectTo });
    // Проверяем что мы ДЕЙСТВИТЕЛЬНО на странице логина
    if (isAuthenticated && !loading && window.location.pathname === '/login') {
      console.log('🚀 LoginPage: Redirecting to', redirectTo);
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);
  
  // 🔍 DEBUG: Отслеживаем redirect useEffect
  useEffectDebugger('LoginPage-redirect-effect', [isAuthenticated, loading, navigate, redirectTo]);

  // Автозаполнение из localStorage если есть данные регистрации
  useEffect(() => {
    const savedLoginData = localStorage.getItem('salonLoginData');
    if (savedLoginData) {
      try {
        const data = JSON.parse(savedLoginData);
        setLoginData(prev => ({
          ...prev,
          email: data.email || '',
          password: data.password || ''
        }));
        // Очищаем после использования
        localStorage.removeItem('salonLoginData');
      } catch (error) {
        console.error('Error parsing saved login data:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof LoginData, value: string | boolean) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Очищаем ошибку при изменении данных
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setError({ message: t('login.validation.required', 'Заполните все обязательные поля') });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await login({
        email: loginData.email,
        password: loginData.password,
        tenantSlug: salonSlug || undefined
      });

      if (result.success) {
        // AuthContext автоматически перенаправит через useEffect выше
        // после получения данных пользователя через /auth/me
      } else {
        setError({
          message: result.error || 'Ошибка входа',
          code: 'LOGIN_FAILED'
        });
      }

    } catch (error) {
      console.error('Login error:', error);
      setError({
        message: error instanceof Error ? error.message : 'Ошибка входа',
        code: 'LOGIN_FAILED'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Beauty Platform
          </h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            {t('login.title', 'Вход в систему')}
          </h2>
          {salonSlug && (
            <p className="mt-2 text-sm text-gray-600">
              {t('login.salon', 'Салон')}: <span className="font-medium">{salonSlug}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {t('login.error', 'Ошибка входа')}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error.message}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('login.email', 'Email')}
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={loginData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('login.emailPlaceholder', 'your@email.com')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('login.password', 'Пароль')}
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={loginData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('login.passwordPlaceholder', 'Введите пароль')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  {t('login.rememberMe', 'Запомнить меня')}
                </Label>
              </div>

              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {t('login.forgotPassword', 'Забыли пароль?')}
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    {t('login.signingIn', 'Вход...')}
                  </>
                ) : (
                  t('login.signIn', 'Войти')
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('login.or', 'или')}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={() => navigate('/register/owner')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('login.createSalon', 'Создать новый салон')}
              </Button>
            </div>
          </div>

          {/* Тестовые данные для разработки */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                {t('login.testData', 'Тестовые данные')}:
              </h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>📧 owner@beauty-test-salon.ru</p>
                <p>🔑 owner123</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoginData(prev => ({
                      ...prev,
                      email: 'owner@beauty-test-salon.ru',
                      password: 'owner123'
                    }));
                  }}
                  className="text-yellow-800 underline hover:text-yellow-900"
                >
                  {t('login.fillTestData', 'Заполнить тестовыми данными')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;