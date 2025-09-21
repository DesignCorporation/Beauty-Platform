import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@beauty-platform/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    port: 6002,
    host: '0.0.0.0',
    allowedHosts: [
      'test-admin.beauty.designcorp.eu',
      'localhost',
      '135.181.156.117'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:6020',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      },
      '/uploads': {
        target: 'http://localhost:6026',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: {
      port: 6002,
      host: 'test-admin.beauty.designcorp.eu',
      clientPort: 443,
      protocol: 'wss'
    }
  },
  preview: {
    port: 6002,
    host: '0.0.0.0',
  }
})