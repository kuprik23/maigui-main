import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  server: {
    https: true,
    open: true,
    host: true
  },
  plugins: [basicSsl()],
  resolve: {
    alias: {
      'three': 'three/build/three.module.js'
    }
  },
  optimizeDeps: {
    include: ['three']
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
