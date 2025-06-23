import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // Removes console.log, console.debug, etc.
        drop_debugger: true   // Removes debugger statements
      }
    },
    rollupOptions: {
      // external: ['@tsparticles/slim']
    }
  }
});
