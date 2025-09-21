module.exports = {
  apps: [
    {
      name: 'beauty-auth-service',
      script: './run.sh',
      cwd: '/root/beauty-platform/services/auth-service',
      env: {
        NODE_ENV: 'development',
        PORT: 6021,
        JWT_SECRET: 'beauty-platform-super-secret-jwt-key-2025-production-grade',
        JWT_REFRESH_SECRET: 'beauty-platform-refresh-secret-key-2025-secure',
        DATABASE_URL: 'postgresql://beauty_platform_user:beauty_platform_2025@localhost:5432/beauty_platform_new',
        MFA_MASTER_KEY: '49dd29bc186073af4bdb05f6fd074317a6045409f1ef540696ed05ad09b38c1b',
        ENABLE_TRACING: 'false',
        PRISMA_ENGINE_PROTOCOL: 'json',
        PRISMA_TELEMETRY_DISABLED: 'true'
      },
      instances: 1,
      exec_mode: 'fork',
      
      // Мониторинг и автоперезапуск
      watch: false,
      max_memory_restart: '200M',
      min_uptime: '10s',
      max_restarts: 3,
      restart_delay: 2000,
      
      // Логирование
      log_file: '/var/log/beauty-auth-service.log',
      error_file: '/var/log/beauty-auth-service-error.log',
      out_file: '/var/log/beauty-auth-service-out.log',
      log_type: 'json',
      merge_logs: true,
      
      // Health check
      health_check_grace_period: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // Автоматический перезапуск при сбоях
      autorestart: true,
      
      // Переменные для мониторинга
      pmx: true
    }
  ]
};