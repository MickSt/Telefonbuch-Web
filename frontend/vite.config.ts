import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  plugins: [react()],
  server: isDev ? {
    port: 8443,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../certs/cert.pem')),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  } : undefined,
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
