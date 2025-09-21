import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldUsePolling = process.env.VITE_USE_POLLING === 'false' ? false : true;

  return ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@beauty-platform/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    port: 6001,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'test-crm.beauty.designcorp.eu',
      'localhost',
      '135.181.156.117'
    ],
    // HMR включен для HTTPS домена
    hmr: {
      host: 'test-crm.beauty.designcorp.eu',
      protocol: 'wss',
      clientPort: 443
    },
    watch: mode === 'development'
      ? {
          usePolling: shouldUsePolling,
          interval: 200,
          ignored: ['**/node_modules/**', '**/dist/**']
        }
      : {
          ignored: ['**/*']
        },
    proxy: {
      '/api': {
        target: 'http://localhost:6020', // API Gateway
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix
      },
    },
  },
  build: {
    // Production оптимизации
    minify: false, // Отключаем минификацию для быстрой сборки
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  preview: {
    port: 6001,
    host: '0.0.0.0',
  }
  })
})
