// CSRF Service для Beauty Platform Client Portal
// Обеспечивает защиту от межсайтовых запросов

export class CSRFService {
  private static instance: CSRFService
  private token: string | null = null
  private readonly AUTH_API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://auth.beauty.designcorp.eu/auth'
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
      ? 'https://auth.beauty.designcorp.eu/auth'
      : 'http://localhost:6021/auth'

  private constructor() {}

  static getInstance(): CSRFService {
    if (!CSRFService.instance) {
      CSRFService.instance = new CSRFService()
    }
    return CSRFService.instance
  }

  /**
   * Получить CSRF токен с сервера
   */
  async getToken(): Promise<string> {
    try {
      const response = await fetch(`${this.AUTH_API_URL}/csrf-token`, {
        method: 'GET',
        credentials: 'include', // КРИТИЧНО! Отправляет httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`CSRF token fetch failed: ${response.status}`)
      }

      const data = await response.json()
      this.token = data.csrfToken || data.token

      if (!this.token) {
        throw new Error('CSRF token not found in response')
      }

      return this.token
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      throw error
    }
  }

  /**
   * Обновить CSRF токен (при 403 ошибках)
   */
  async refreshToken(): Promise<string> {
    this.token = null // Очищаем кэш
    return await this.getToken()
  }

  /**
   * Получить заголовки с CSRF токеном
   */
  async getHeaders(): Promise<Record<string, string>> {
    if (!this.token) {
      await this.getToken()
    }

    return {
      'X-CSRF-Token': this.token!,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Получить текущий токен (может быть null)
   */
  getCurrentToken(): string | null {
    return this.token
  }

  /**
   * Очистить токен (при logout)
   */
  clearToken(): void {
    this.token = null
  }

  /**
   * Проверить, есть ли действительный токен
   */
  hasValidToken(): boolean {
    return this.token !== null
  }

  /**
   * Автоматическая обработка CSRF ошибок и retry
   */
  async handleCSRFError<T>(requestFn: () => Promise<T>): Promise<T> {
    try {
      return await requestFn()
    } catch (error: any) {
      // Если ошибка связана с CSRF, пробуем обновить токен
      if (error.status === 403 || error.message?.includes('CSRF')) {
        console.warn('CSRF error detected, refreshing token and retrying...')
        await this.refreshToken()
        return await requestFn()
      }
      throw error
    }
  }
}

// Экспорт singleton instance
export const csrfService = CSRFService.getInstance()