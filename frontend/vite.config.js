import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Same-origin in dev too, so the HttpOnly auth cookie just works
      '/api': 'http://localhost:5000',
    },
  },
});
