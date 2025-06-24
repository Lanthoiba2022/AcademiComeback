import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js', 'recharts'],
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
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts', 'react-calendar-heatmap'],
          'animation-vendor': ['framer-motion', '@tsparticles/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
