import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
  ],
  server: {
    port: 7000,
    host: true,
    proxy: {
      '/auth': 'http://localhost:8788',
      '/api': 'http://localhost:8788',
    }
  }
});
