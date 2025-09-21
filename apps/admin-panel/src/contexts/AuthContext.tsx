import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '../services/api'
import { csrfService } from '../services/csrf'

// Типы для пользователя и контекста
export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  tenantId: string | null
  permissions: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface MFARequiredData {
  userId: string
  email: string
  role: string
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  completeMFA: (userId: string, token: string) => Promise<void>
  forceLogout: () => Promise<void>
  mfaRequired?: MFARequiredData | null
  mfaSetupRequired?: boolean
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook для использования контекста
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Провайдер контекста
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })
  
  const [mfaRequired, setMfaRequired] = useState<MFARequiredData | null>(null)
  const [mfaSetupRequired, setMfaSetupRequired] = useState<boolean>(false)

  // ✅ БЕЗОПАСНО: Токены в httpOnly cookies + CSRF защита
  // Браузер автоматически отправляет cookies
  // JavaScript не может получить доступ к httpOnly cookies (защита от XSS)
  // CSRF токены защищают от межсайтовых запросов

  // Функция для получения информации о пользователе
  const fetchUserInfo = async (): Promise<User> => {
    try {
      const data = await apiService.auth.me()
      return data.user || data
    } catch (error) {
      throw new Error('Failed to fetch user info')
    }
  }

  // Функция логина
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const data = await apiService.auth.login(email, password)
      
      // 🛡️ Проверяем требуется ли MFA
      if (!data.success && data.code === 'MFA_REQUIRED') {
        console.log('🔍 Login: MFA Required detected:', {
          userId: data.userId,
          email: data.email,
          role: data.role,
          currentStep: 'login_mfa_required'
        });
        
        // MFA требуется - сохраняем данные и НЕ устанавливаем аутентификацию
        const mfaData = {
          userId: data.userId,
          email: data.email,
          role: data.role
        };
        
        setMfaRequired(mfaData);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        console.log('🔍 Login: MFA data saved to state:', mfaData);
        
        // Бросаем специальную ошибку которую LoginForm может обработать
        const mfaError = new Error('MFA verification required')
        ;(mfaError as any).code = 'MFA_REQUIRED'
        ;(mfaError as any).mfaData = mfaData
        throw mfaError
      }

      const { user } = data // Обычный ответ или MFA Setup Required

      // Проверяем права доступа к админке
      if (user.role !== 'SUPER_ADMIN') {
        throw new Error('Недостаточно прав для доступа к админ-панели')
      }

      // 🔧 Проверяем требуется ли настройка MFA
      if (data.mfaSetupRequired) {
        setMfaSetupRequired(true)
        setAuthState({
          user,
          isAuthenticated: true, // Частичная аутентификация для настройки MFA
          isLoading: false
        })
        return // Выходим с ограниченным доступом
      }

      // ✅ Полная аутентификация
      setMfaRequired(null)
      setMfaSetupRequired(false)
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }))
      throw error
    }
  }

  // Функция обновления токена
  const refreshToken = async (): Promise<void> => {
    try {
      const data = await apiService.auth.refresh()
      const { user } = data // Новый access token автоматически в cookie

      // Обновляем состояние
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      // Если обновление токена не удалось, выходим
      logout()
      throw error
    }
  }

  // Функция выхода
  const logout = async (): Promise<void> => {
    try {
      // Уведомляем сервер о выходе (очистит cookies сервер)
      await apiService.auth.logout()
    } catch (logoutError) {
      // Игнорируем ошибки logout - сервер очистит cookies в любом случае
      console.log('Server logout failed (expected if token expired):', logoutError)
    } finally {
      // Очищаем CSRF токен и состояние приложения
      csrfService.clearToken()
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
      
      // Очищаем MFA состояния
      setMfaRequired(null)
      setMfaSetupRequired(false)
    }
  }

  // Завершение MFA аутентификации
  const completeMFA = async (userId: string, token: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      // 🚨 ДИАГНОСТИКА: Проверяем состояние mfaRequired
      console.log('🔍 MFA State Diagnosis:', {
        mfaRequired: mfaRequired,
        mfaRequiredKeys: mfaRequired ? Object.keys(mfaRequired) : 'NULL',
        authState: authState,
        currentStep: 'completeMFA_start'
      });
      
      // 🔐 Используем email из mfaRequired вместо хардкода
      const email = mfaRequired?.email || 'admin@beauty-platform.com'
      console.log('🔐 MFA Completion Request:', { 
        userId, 
        code: token, 
        email,
        emailSource: mfaRequired?.email ? 'from_mfaRequired' : 'fallback_hardcode',
        requestPayload: { userId, code: token, email }
      })
      
      const data = await apiService.auth.completeMFA(userId, token, email)
      console.log('🔐 MFA API Response:', data)
      
      if (data.success) {
        // Получаем данные пользователя после успешного MFA
        const user = await fetchUserInfo()
        console.log('✅ MFA Success - User data retrieved:', user.email)
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        })
        
        // Очищаем MFA состояния
        setMfaRequired(null)
        setMfaSetupRequired(false)
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        throw new Error(data.error || 'MFA verification failed')
      }
    } catch (error) {
      console.error('🚨 MFA Completion Error:', error)
      console.error('🚨 Debug Info:', { userId, token: token.substring(0, 4) + '...', mfaRequired })
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  // Принудительный выход с очисткой всех cookies
  const forceLogout = async (): Promise<void> => {
    try {
      // Вызываем force-logout endpoint
      await apiService.get('/auth/force-logout')
    } catch (error) {
      // Игнорируем ошибки API, главное очистить состояние
      console.log('Force logout API failed (expected):', error)
    } finally {
      // Очищаем CSRF токен и состояние приложения
      csrfService.clearToken()
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
      
      // Очищаем MFA состояния
      setMfaRequired(null)
      setMfaSetupRequired(false)
      
      // Перезагружаем страницу для полной очистки
      window.location.href = '/login'
    }
  }

  // Проверка аутентификации при загрузке (через httpOnly cookies)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем аутентификацию через cookie (автоматически отправляется)
        const user = await fetchUserInfo()
        
        // Проверяем права доступа к админке
        if (user.role !== 'SUPER_ADMIN') {
          logout()
          return
        }

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      } catch (error) {
        // Если access token недействителен, пробуем обновить через refresh
        console.log('🔒 No valid access token, trying refresh...')
        try {
          await refreshToken()
        } catch (refreshError) {
          // Если refresh тоже не удался, пользователь не аутентифицирован
          console.log('🔒 No valid refresh token, user needs to login')
          setAuthState({
            user: null,
            isAuthenticated: false,  // Явно указываем что пользователь НЕ аутентифицирован
            isLoading: false
          })
        }
      }
    }

    initAuth()
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    completeMFA,
    forceLogout,
    mfaRequired,
    mfaSetupRequired
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}