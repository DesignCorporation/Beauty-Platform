import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useDebugLogger, useEffectDebugger, useStateDebugger } from '../hooks/useDebugLogger';
const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const { login, isAuthenticated, loading } = useAuthContext();
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
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
            }
            catch (error) {
                console.error('Error parsing saved login data:', error);
            }
        }
    }, []);
    const handleInputChange = (field, value) => {
        setLoginData(prev => ({ ...prev, [field]: value }));
        if (error)
            setError(null); // Очищаем ошибку при изменении данных
    };
    const handleSubmit = async (e) => {
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
            }
            else {
                setError({
                    message: result.error || 'Ошибка входа',
                    code: 'LOGIN_FAILED'
                });
            }
        }
        catch (error) {
            console.error('Login error:', error);
            setError({
                message: error instanceof Error ? error.message : 'Ошибка входа',
                code: 'LOGIN_FAILED'
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8", children: [_jsx("div", { className: "sm:mx-auto sm:w-full sm:max-w-md", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('login.title', 'Вход в систему') }), salonSlug && (_jsxs("p", { className: "mt-2 text-sm text-gray-600", children: [t('login.salon', 'Салон'), ": ", _jsx("span", { className: "font-medium", children: salonSlug })] }))] }) }), _jsx("div", { className: "mt-8 sm:mx-auto sm:w-full sm:max-w-md", children: _jsxs("div", { className: "bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10", children: [_jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-4", children: _jsxs("div", { className: "flex", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-red-400" }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: t('login.error', 'Ошибка входа') }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: error.message })] })] }) })), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: t('login.email', 'Email') }), _jsx("div", { className: "mt-1", children: _jsx(Input, { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: loginData.email, onChange: (e) => handleInputChange('email', e.target.value), className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm", placeholder: t('login.emailPlaceholder', 'your@email.com') }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: t('login.password', 'Пароль') }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Input, { id: "password", name: "password", type: showPassword ? 'text' : 'password', autoComplete: "current-password", required: true, value: loginData.password, onChange: (e) => handleInputChange('password', e.target.value), className: "appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm", placeholder: t('login.passwordPlaceholder', 'Введите пароль') }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400 hover:text-gray-500" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400 hover:text-gray-500" })) })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "remember-me", name: "remember-me", type: "checkbox", checked: loginData.rememberMe, onChange: (e) => handleInputChange('rememberMe', e.target.checked), className: "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" }), _jsx(Label, { htmlFor: "remember-me", className: "ml-2 block text-sm text-gray-900", children: t('login.rememberMe', 'Запомнить меня') })] }), _jsx("div", { className: "text-sm", children: _jsx("a", { href: "/forgot-password", className: "font-medium text-indigo-600 hover:text-indigo-500", children: t('login.forgotPassword', 'Забыли пароль?') }) })] }), _jsx("div", { children: _jsx(Button, { type: "submit", disabled: isLoading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "animate-spin -ml-1 mr-3 h-5 w-5" }), t('login.signingIn', 'Вход...')] })) : (t('login.signIn', 'Войти')) }) })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: t('login.or', 'или') }) })] }), _jsx("div", { className: "mt-6", children: _jsx(Button, { type: "button", onClick: () => navigate('/register/owner'), className: "w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: t('login.createSalon', 'Создать новый салон') }) })] }), process.env.NODE_ENV === 'development' && (_jsxs("div", { className: "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md", children: [_jsxs("h4", { className: "text-sm font-medium text-yellow-800 mb-2", children: [t('login.testData', 'Тестовые данные'), ":"] }), _jsxs("div", { className: "text-xs text-yellow-700 space-y-1", children: [_jsx("p", { children: "\uD83D\uDCE7 owner@beauty-test-salon.ru" }), _jsx("p", { children: "\uD83D\uDD11 owner123" }), _jsx("button", { type: "button", onClick: () => {
                                                setLoginData(prev => ({
                                                    ...prev,
                                                    email: 'owner@beauty-test-salon.ru',
                                                    password: 'owner123'
                                                }));
                                            }, className: "text-yellow-800 underline hover:text-yellow-900", children: t('login.fillTestData', 'Заполнить тестовыми данными') })] })] }))] }) })] }));
};
export default LoginPage;
