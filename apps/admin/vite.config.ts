import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env['VITE_API_URL'] || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
