import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const allowedHosts = (env.VITE_ALLOWED_HOSTS || 'localhost')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: parseInt(env.VITE_DEV_PORT || '5173'),
      allowedHosts,
      proxy: {
        '/api': {
          target: `http://localhost:${env.VITE_BACKEND_PORT || '5000'}`,
          changeOrigin: true,
        },
      },
    },
  }
})
