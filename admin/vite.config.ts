import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/admin/', // 部署在 Nginx /admin 子路径下，资源用相对 /admin 的绝对路径

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://47.107.188.239:3000', // 阿里云后端；本地开发可改回 localhost:3000
        changeOrigin: true,
      },
    },
  },
})
