import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const coachProxyTarget = 'http://localhost:8787'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/coach': {
        target: coachProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api/coach': {
        target: coachProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
