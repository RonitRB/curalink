import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['jspdf', 'html2canvas', 'recharts', 'es-toolkit']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})
