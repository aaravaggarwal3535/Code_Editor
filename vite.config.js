import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin()
  ],
  build: {
    sourcemap: false,
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Monaco Editor into its own chunk
          'monaco': ['@monaco-editor/react'],
          // React core libraries in a different chunk
          'framework': ['react', 'react-dom', 'react-router-dom'],
          // UI/utility libraries
          'ui': ['react-icons'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['@monaco-editor/react', 'react', 'react-dom', 'react-router-dom'],
    exclude: []
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
