// Environment configuration with secure fallbacks
// Based on Beauty Platform security documentation

export const ENVIRONMENT = {
  // ПРИНУДИТЕЛЬНО используем nginx proxy endpoints
  API_URL: '/api/auth',
  AUTH_URL: '/api/auth',
  
  // Development fallbacks
  DEV_API_URL: 'http://localhost:6021',
  DEV_AUTH_URL: 'http://localhost:6021',
  
  // Environment detection
  isDevelopment: import.meta.env.DEV || false,
  isProduction: import.meta.env.PROD || false,
  
  // Get correct URL based on environment
  getApiUrl(): string {
    // Используем сконфигурированный URL с fallback логикой
    const url = this.API_URL;
    console.log('🔗 Using API URL:', url);
    return url;
  },
  
  getAuthUrl(): string {
    // DEBUG: покажем информацию об окружении
    console.log('🔍 Environment DEBUG:', {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      isDev: this.isDevelopment,
      isProd: this.isProduction,
      envAuthUrl: import.meta.env.VITE_AUTH_URL
    });
    
    // Используем сконфигурированный URL с fallback логикой
    const url = this.AUTH_URL;
    console.log('🔗 Using Auth URL:', url);
    return url;
  }
}

// Валидация конфигурации при загрузке
if (ENVIRONMENT.isProduction) {
  if (!ENVIRONMENT.API_URL.startsWith('https://')) {
    console.error('❌ SECURITY ERROR: Production API URL must use HTTPS!')
  }
  
  if (!ENVIRONMENT.AUTH_URL.startsWith('https://')) {
    console.error('❌ SECURITY ERROR: Production Auth URL must use HTTPS!')
  }
  
  console.log('✅ Production environment configured securely')
  console.log(`🔗 Auth URL: ${ENVIRONMENT.getAuthUrl()}`)
}

export default ENVIRONMENT