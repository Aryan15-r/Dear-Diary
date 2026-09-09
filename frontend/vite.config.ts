import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:4000',
      '/entries': 'http://localhost:4000',
      '/audio': 'http://localhost:4000',
      '/access': 'http://localhost:4000',
      '/api': 'http://localhost:4000'
    }
  },
  build: {
    outDir: process.env.VERCEL ? '../dist' : '../public',
    emptyOutDir: true
  }
});
