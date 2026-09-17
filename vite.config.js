import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true,
    strictPort: false,
    cors: true,
    // GLB files ko serve karne ke liye
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  // .glb files ko asset ke tarah treat karein
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr', '**/*.mp3'],
  optimizeDeps: {
    include: ['three', 'react', 'react-dom']
  }
})
