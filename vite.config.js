import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:8000'
const wsTarget = process.env.VITE_WS_TARGET || 'ws://localhost:8004'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/ws': {
        target: wsTarget,
        ws: true,
      },
    },
  },
})
