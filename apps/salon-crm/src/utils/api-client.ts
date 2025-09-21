// Secure API Client with CSRF protection
// Based on Beauty Platform security documentation

import ENVIRONMENT from '../config/environment'

interface ApiRequestOptions extends RequestInit {
  skipCSRF?: boolean
}

class SecureApiClient {
  private csrfToken: string | null = null
  private baseUrl: string

  constructor() {
    this.baseUrl = ENVIRONMENT.getAuthUrl()
    console.log('🔧 Auth URL from environment:', this.baseUrl)
  }

  // Получение CSRF токена с auth service
  private async getCSRFToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      console.log('🔧 Getting CSRF token from auth service...');
      const response = await fetch(`${this.baseUrl}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      console.log('✅ CSRF token obtained successfully');
      return this.csrfToken;
    } catch (error) {
      console.error('❌ Failed to get CSRF token:', error);
      throw error;
    }
  }

  // Основной метод для запросов с автоматической обработкой CSRF и токенов
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { skipCSRF = false, ...requestOptions } = options
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`

    // Подготовка заголовков
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestOptions.headers as Record<string, string>,
    }

    // Добавляем CSRF токен для изменяющих операций
    if (!skipCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(requestOptions.method || 'GET')) {
      try {
        const csrfToken = await this.getCSRFToken()
        headers['X-CSRF-Token'] = csrfToken
      } catch (error) {
        console.warn('Failed to get CSRF token, proceeding without it:', error)
      }
    }

    try {
      console.log('🌐 API Request:', {
        method: requestOptions.method || 'GET',
        url,
        headers,
        timestamp: new Date().toISOString(),
        isAuthPage: typeof window !== 'undefined' && 
                   (window.location.pathname.includes('/login') || 
                    window.location.pathname.includes('/register'))
      });
      
      const response = await fetch(url, {
        ...requestOptions,
        credentials: 'include', // КРИТИЧНО! Отправляет httpOnly cookies
        headers,
      })

      // Обработка истечения токена
      if (response.status === 401) {
        // 🚫 НЕ пытаемся обновить токен на страницах аутентификации
        if (typeof window !== 'undefined') {
          const isAuthPage = window.location.pathname.includes('/login') || 
                            window.location.pathname.includes('/register');
          
          if (isAuthPage) {
            console.log('🚫 API client: Skip token refresh on auth page');
            throw new Error('Authentication failed')
          }
        }
        
        // Пробуем обновить токен
        const refreshSuccess = await this.refreshToken()
        
        if (refreshSuccess) {
          // Повторяем оригинальный запрос
          return this.request(endpoint, options)
        } else {
          // Перенаправляем на логин
          this.handleAuthFailure()
          throw new Error('Authentication failed')
        }
      }

      // Обработка CSRF ошибок
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.code === 'EBADCSRFTOKEN') {
          // Сбрасываем CSRF токен и пробуем еще раз
          this.csrfToken = null
          return this.request(endpoint, options)
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Обновление токена
  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // Обработка ошибок аутентификации
  private handleAuthFailure(): void {
    // Очищаем локальные данные
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    
    // ИСПРАВЛЕНИЕ: НЕ делаем автоматический редирект тут
    // Пусть useAuth управляет редиректами
    console.log('🚨 Authentication failed - token invalid or expired')
  }

  // Сброс состояния (при логауте)
  reset(): void {
    this.csrfToken = null
  }

  // Вспомогательные методы
  async get<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// Singleton экземпляр
export const apiClient = new SecureApiClient()
export default apiClient