// API Service с CSRF интеграцией для Beauty Platform Admin Panel
// Обеспечивает безопасные HTTP запросы с автоматической обработкой CSRF токенов

import { csrfService } from './csrf'

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  skipCSRF?: boolean // Для GET запросов
}

export class ApiService {
  private static instance: ApiService
  private readonly AUTH_API_URL = '/api/auth'

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  /**
   * Выполнить HTTP запрос с автоматической CSRF защитой
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      skipCSRF = false
    } = options

    // Базовые заголовки
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    }

    // Добавляем CSRF токен для небезопасных методов
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !skipCSRF
    if (needsCSRF) {
      try {
        console.log('🔐 Getting CSRF token for request...')
        const csrfHeaders = await csrfService.getHeaders()
        console.log('✅ Got CSRF headers:', Object.keys(csrfHeaders))
        headers = { ...headers, ...csrfHeaders }
      } catch (error) {
        console.error('❌ Failed to get CSRF headers:', error)
        console.log('⚠️ Proceeding without CSRF token...')
        // Не выбрасываем ошибку, а пробуем без CSRF токена
        // throw new Error('CSRF token required but unavailable')
      }
    }

    // Подготавливаем запрос
    const requestOptions: RequestInit = {
      method,
      credentials: 'include', // КРИТИЧНО! Отправляет httpOnly cookies
      headers
    }

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body)
    }

    try {
      console.log(`🌐 API Request: ${method} ${endpoint}`)
      console.log('📋 Request options:', { ...requestOptions, body: body ? 'redacted' : undefined })
      const response = await fetch(endpoint, requestOptions)
      console.log(`📡 Response status: ${response.status} ${response.statusText}`)

      // Обработка 403 - возможно недействительный CSRF токен
      if (response.status === 403 && needsCSRF) {
        console.log('403 error, refreshing CSRF token and retrying...')
        
        try {
          // Обновляем CSRF токен
          await csrfService.refreshToken()
          
          // Обновляем заголовки с новым токеном
          const newCsrfHeaders = await csrfService.getHeaders()
          headers = { ...headers, ...newCsrfHeaders }
          requestOptions.headers = headers

          // Повторяем запрос
          const retryResponse = await fetch(endpoint, requestOptions)
          
          if (!retryResponse.ok) {
            throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText}`)
          }

          return await this.parseResponse<T>(retryResponse)
        } catch (retryError) {
          console.error('CSRF retry failed:', retryError)
          throw retryError
        }
      }

      if (!response.ok) {
        // 🔐 401 EXPECTED: Нормальное поведение для неаутентифицированных запросов
        if (response.status === 401) {
          console.log(`🔒 Authentication required for ${method} ${endpoint} (expected behavior)`)
        } else {
          console.error(`❌ API Error: ${response.status} ${response.statusText} for ${method} ${endpoint}`)
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await this.parseResponse<T>(response)
    } catch (error) {
      // Улучшенное логирование: не показываем 401 как ошибки
      if (error instanceof Error && error.message.includes('401')) {
        console.log('🔒 Authentication check completed (user not authenticated)')
      } else {
        console.error('❌ API request error:', error)
      }
      throw error
    }
  }

  /**
   * Парсинг ответа с обработкой разных типов контента
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    // Для не-JSON ответов возвращаем как текст
    const text = await response.text()
    return text as unknown as T
  }

  /**
   * GET запрос (без CSRF)
   */
  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers: headers || {}, skipCSRF: true })
  }

  /**
   * POST запрос (с CSRF)
   */
  async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers: headers || {} })
  }

  /**
   * PUT запрос (с CSRF)
   */
  async put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers: headers || {} })
  }

  /**
   * DELETE запрос (с CSRF)
   */
  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers: headers || {} })
  }

  /**
   * Auth-специфичные методы
   */
  auth = {
    me: () => this.get(`${this.AUTH_API_URL}/me`),
    login: (email: string, password: string) => 
      this.post(`${this.AUTH_API_URL}/login`, { email, password }),
    logout: () => this.post(`${this.AUTH_API_URL}/logout`),
    refresh: () => this.post(`${this.AUTH_API_URL}/refresh`),
    permissions: () => this.get(`${this.AUTH_API_URL}/permissions`),
    completeMFA: (userId: string, code: string, email: string) =>
      this.post(`${this.AUTH_API_URL}/mfa/complete-login`, { userId, code, email }),
    getMFAStats: () => this.get(`${this.AUTH_API_URL}/mfa/stats`),
    getMFAStatus: () => this.get(`${this.AUTH_API_URL}/mfa/status`)
  }
}

// Экспорт singleton instance
export const apiService = ApiService.getInstance()