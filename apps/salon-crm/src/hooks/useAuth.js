import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/api-client';
import { useDebugLogger, useEffectDebugger, useStateDebugger } from './useDebugLogger';
export const useAuth = () => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });
    // 🔍 DEBUG: Отслеживаем рендеры и состояние
    useDebugLogger('useAuth', authState);
    useStateDebugger('authState', authState);
    // ✅ DEBOUNCE: Предотвращаем множественные запросы
    const lastFetchTime = useRef(0);
    const debounceTimeout = useRef();
    const DEBOUNCE_DELAY = 1000; // 1 секунда между запросами
    const refreshIntervalRef = useRef(null);
    const SESSION_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 час
    // ✅ Реальная проверка аутентификации через Auth Service с DEBOUNCE
    const fetchUser = useCallback(async (force = false, skipAuthPageCheck = false) => {
        // 🚫 ПОЛНАЯ БЛОКИРОВКА на страницах аутентификации (кроме принудительных запросов после логина)
        if (typeof window !== 'undefined' && !skipAuthPageCheck) {
            const isAuthPage = window.location.pathname.includes('/login') ||
                window.location.pathname.includes('/register');
            if (isAuthPage && !force) {
                console.log('🚫 useAuth.fetchUser: BLOCKED on auth page', {
                    pathname: window.location.pathname,
                    href: window.location.href,
                    timestamp: new Date().toISOString()
                });
                return;
            }
        }
        const now = Date.now();
        // ✅ DEBOUNCE: Проверяем не слишком ли часто делаем запросы
        if (now - lastFetchTime.current < DEBOUNCE_DELAY) {
            console.log('⏳ useAuth: Debouncing auth check, skipping request');
            return;
        }
        lastFetchTime.current = now;
        try {
            console.log('🚀 useAuth: Checking authentication with Auth Service');
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            // Проверяем аутентификацию через Auth Service
            console.log('📡 useAuth: Making API request to /me');
            const response = await apiClient.get('/me');
            console.log('📡 useAuth: API response received:', response);
            if (response.success && response.user) {
                console.log('✅ User authenticated:', response.user.email);
                setAuthState({
                    isAuthenticated: true,
                    user: response.user,
                    loading: false,
                    error: null,
                });
            }
            else {
                throw new Error('User not authenticated');
            }
        }
        catch (error) {
            console.log('❌ Auth check failed - user not authenticated:', error);
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null, // Не показываем error если просто не авторизован
            });
            // Если мы НЕ на странице логина/регистрации, НЕ делаем редирект
            // ProtectedRoute будет управлять редиректами
            if (typeof window !== 'undefined' &&
                !window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/register')) {
                console.log('🔐 Auth failed - ProtectedRoute will handle redirect');
            }
        }
    }, []);
    // ✅ ПОЛНАЯ БЛОКИРОВКА: НЕ ЗАПУСКАЕМ useEffect на auth страницах
    useEffect(() => {
        console.log('🔥 useAuth useEffect STARTED', {
            pathname: window?.location?.pathname,
            href: window?.location?.href,
            timestamp: new Date().toISOString()
        });
        // 🚫 ПОЛНАЯ БЛОКИРОВКА на страницах логина/регистрации
        if (typeof window !== 'undefined') {
            const isAuthPage = window.location.pathname.includes('/login') ||
                window.location.pathname.includes('/register');
            if (isAuthPage) {
                console.log('🚫 useAuth useEffect: COMPLETELY BLOCKED on auth page', {
                    pathname: window.location.pathname,
                    href: window.location.href,
                    timestamp: new Date().toISOString()
                });
                // Устанавливаем начальное состояние для auth страниц
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    loading: false, // ИСПРАВЛЕНО: НЕ загружаем на auth страницах
                    error: null,
                });
                console.log('🚫 useAuth useEffect: EARLY RETURN - no API calls');
                return; // ПОЛНЫЙ ВЫХОД ИЗ useEffect
            }
        }
        const checkAuth = () => {
            console.log('🔐 REAL AUTH: Checking authentication with Auth Service');
            fetchUser();
        };
        // Проверяем только при первом монтировании на не-auth страницах
        checkAuth();
        // Очистка таймера при размонтировании
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []); // НИКАКИХ dependencies для предотвращения re-render
    // 🔍 DEBUG: Отслеживаем useEffect
    useEffectDebugger('useAuth-main-effect', []);
    // ✅ ВКЛЮЧЕНО - реальный логин через Auth Service
    const login = useCallback(async (credentials) => {
        try {
            console.log('🔧 useAuth.login: Authenticating with Auth Service');
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            // Добавляем salonSlug если есть tenantSlug
            const loginData = {
                ...credentials,
                salonSlug: credentials.tenantSlug
            };
            const response = await apiClient.post('/login', loginData);
            if (response.success) {
                console.log('✅ Login successful');
                // После успешного логина получаем данные пользователя (пропускаем проверку auth страницы)
                await fetchUser(true, true);
                return { success: true };
            }
            else {
                throw new Error(response.error || 'Login failed');
            }
        }
        catch (error) {
            console.error('❌ Login failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            return { success: false, error: errorMessage };
        }
    }, []); // Убираем fetchUser из dependencies чтобы избежать цикла
    // Логаут
    const logout = useCallback(async () => {
        try {
            // Вызываем logout endpoint для инвалидации токенов
            await apiClient.post('/logout', {});
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
            // В любом случае очищаем локальное состояние
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            });
            // Сбрасываем состояние API клиента
            apiClient.reset();
            // Перенаправляем на логин
            window.location.href = '/login';
        }
    }, []);
    // Обновление токена (автоматически через API client)
    const refreshAuth = useCallback(async () => {
        // 🚫 ПОЛНАЯ БЛОКИРОВКА на страницах аутентификации
        if (typeof window !== 'undefined') {
            const isAuthPage = window.location.pathname.includes('/login') ||
                window.location.pathname.includes('/register');
            if (isAuthPage) {
                console.log('🚫 useAuth.refreshAuth: BLOCKED on auth page');
                return;
            }
        }
        await fetchUser();
    }, []); // Убираем fetchUser из dependencies чтобы избежать цикла
    useEffect(() => {
        if (authState.isAuthenticated) {
            const performRefresh = async () => {
                try {
                    console.log('🔄 useAuth: автоматическое обновление сессии');
                    await apiClient.post('/refresh');
                }
                catch (error) {
                    console.error('❌ useAuth: автоматическое обновление не удалось', error);
                }
            };
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            refreshIntervalRef.current = setInterval(performRefresh, SESSION_REFRESH_INTERVAL);
            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    refreshIntervalRef.current = null;
                }
            };
        }
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, [authState.isAuthenticated]);
    return {
        ...authState,
        login,
        logout,
        refreshAuth,
        refetch: fetchUser,
    };
};
