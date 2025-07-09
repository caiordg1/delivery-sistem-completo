import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['admin.fortalcar.com'],
    origin: 'https://admin.fortalcar.com',
    proxy: {
      '/menu': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/menu/, '/menu')
      }
    }
  }
})
