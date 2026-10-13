import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { istanbulCoverage } from './test/domain/vite-istanbul';

/**
 * The mock Express backend (test/mock-backend/server.js) owns /api on port 4310.
 * The React dev server proxies /api straight through so the app and the
 * Playwright suites can run against one origin, exactly as the AngularJS app did.
 */
const API_TARGET = process.env.API_TARGET || 'http://localhost:4310';

export default defineConfig({
  // istanbulCoverage() is a no-op unless COVERAGE=1 (set by the Playwright suites).
  plugins: [react(), istanbulCoverage(__dirname)],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
