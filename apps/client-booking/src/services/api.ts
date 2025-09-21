// Secure API Client для Beauty Platform Client Portal
// Включает CSRF protection и автоматическое управление токенами

import { csrfService } from './csrf'

interface ApiRequestOptions extends RequestInit {
  skipCSRF?: boolean
  skipAuth?: boolean
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ClientApiService {
  private static instance: ClientApiService
  private readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://auth.beauty.designcorp.eu/auth'
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
      ? 'https://auth.beauty.designcorp.eu/auth'  
      : 'http://localhost:6021/auth'

  private constructor() {}

  static getInstance(): ClientApiService {
    if (!ClientApiService.instance) {
      ClientApiService.instance = new ClientApiService()
    }
    return ClientApiService.instance
  }

  /**
   * Основной метод для API запросов с CSRF защитой
   */
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipCSRF = false, skipAuth = false, ...requestOptions } = options
    const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE_URL}${endpoint}`

    // Подготовка базовых заголовков
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestOptions.headers as Record<string, string>,
    }

    // Добавляем CSRF токен для изменяющих операций
    if (!skipCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(requestOptions.method || 'GET')) {
      try {
        const csrfHeaders = await csrfService.getHeaders()
        Object.assign(headers, csrfHeaders)
      } catch (error) {
        console.warn('Failed to get CSRF token, proceeding without it:', error)
        // В production это должно быть строже
        if (process.env.NODE_ENV === 'production') {
          throw new Error('CSRF token required for this operation')
        }
      }
    }

    try {
      const response = await fetch(url, {
        ...requestOptions,
        credentials: 'include', // КРИТИЧНО! Отправляет httpOnly cookies
        headers,
      })

      // Обработка различных статусов ответа
      if (response.status === 403) {
        // Возможная CSRF ошибка
        if (!skipCSRF) {
          console.warn('403 error, possibly CSRF related. Attempting token refresh...')
          await csrfService.refreshToken()
          // Retry запрос с новым токеном
          return this.request(endpoint, options)
        }
      }

      if (response.status === 401 && !skipAuth) {
        // Неавторизован - очищаем CSRF токен и перенаправляем на логин
        csrfService.clearToken()
        window.location.href = '/login'
        throw new Error('Authentication required')
      }

      // Парсинг JSON ответа
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error: any) {
      console.error('API request failed:', error)
      
      // Специальная обработка сетевых ошибок
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.')
      }

      throw error
    }
  }

  // Convenience методы
  async get<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Специальные методы для клиентского портала
   */

  // Регистрация клиента
  async registerClient(userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
  }): Promise<ApiResponse> {
    return this.post('/register-client', userData)
  }

  // Вход клиента
  async loginClient(credentials: {
    email: string
    password: string
  }): Promise<ApiResponse> {
    return this.post('/login-client', credentials)
  }

  // Выход клиента
  async logoutClient(): Promise<ApiResponse> {
    const result = await this.post('/logout-client')
    csrfService.clearToken() // Очищаем CSRF токен при выходе
    return result
  }

  // Получение информации о клиенте
  async getClientProfile(): Promise<ApiResponse> {
    return this.get('/client/profile')
  }

  // Обновление профиля клиента
  async updateClientProfile(data: any): Promise<ApiResponse> {
    return this.put('/client/profile', data)
  }

  // Поиск салонов
  async searchSalons(query: string, location?: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ q: query })
    if (location) params.append('location', location)
    return this.get(`/salons/search?${params}`)
  }

  // Получение расписания салона
  async getSalonSchedule(salonId: string, date: string): Promise<ApiResponse> {
    return this.get(`/salons/${salonId}/schedule?date=${date}`)
  }

  // Создание записи
  async createBooking(bookingData: {
    salonId: string
    serviceId: string
    staffId: string
    date: string
    time: string
    notes?: string
  }): Promise<ApiResponse> {
    return this.post('/bookings', bookingData)
  }

  // Получение записей клиента
  async getClientBookings(): Promise<ApiResponse> {
    return this.get('/client/bookings')
  }

  // Отмена записи
  async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse> {
    return this.delete(`/bookings/${bookingId}`, {
      body: reason ? JSON.stringify({ reason }) : undefined
    })
  }
}

// Экспорт singleton instance
export const clientApi = ClientApiService.getInstance()