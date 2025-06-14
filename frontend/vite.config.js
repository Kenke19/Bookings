import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost', // Your PHP server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/Bookings/backend/api'),
        secure: false
      }
    }
  }
});