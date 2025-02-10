import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: '',
  server: {
    open: true,
    host: true
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    basicSsl()
  ],
  resolve: {
    alias: {
      'three': 'three',
      'three/examples/jsm/': 'three/examples/jsm/'
    }
  },
  optimizeDeps: {
    include: ['three']
  },
  build: {
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
