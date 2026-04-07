import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // AI Studio used this flag to stabilize local editing; it is not required for Vercel.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
