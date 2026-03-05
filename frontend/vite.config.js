import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置文件
// 用于配置开发服务器、代理、构建选项等
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 代理 API 请求到后端服务器
      // 这样做的好处是：前端开发时可以直接使用相对路径 /api/xxx
      // 而无需关心后端服务器的实际地址
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
