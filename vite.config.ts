import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // 使用相对资源路径，便于构建产物部署到任意子目录。
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // AI Studio 曾用这个开关稳定本地编辑，在 Vercel 环境中不是必需项。
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
