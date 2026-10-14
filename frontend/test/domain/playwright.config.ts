import { defineConfig } from '@playwright/test';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** Mock Express backend — the data layer for both the app and this suite. */
export const API_PORT = Number(process.env.API_PORT || 4310);
/** Vite dev server hosting the React app, with /api proxied to API_PORT. */
export const PORT = Number(process.env.APP_PORT || 5173);
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * Two-layer behavioural suite:
 *   scenarios/ — framework-agnostic specs (Layer 1)
 *   pom/       — Page Object Model, the only place selectors live (Layer 2)
 *
 * Unlike the AngularJS run (one Express process served both /api and the static
 * app), React needs two servers: Vite for the app and the mock backend for /api.
 * Vite proxies /api to the backend so the suite still talks to a single origin
 * and `page.goto('/products')` / `request.post('/api/__test/reset')` both work.
 *
 * Coverage runs must be single-worker: window.__coverage__ lives per browser
 * context and the merge target on disk is a single file.
 */
export default defineConfig({
  testDir: path.join(__dirname, 'scenarios'),
  testMatch: /.*\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
  use: {
    baseURL: BASE_URL,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'off',
  },
  webServer: [
    {
      // API only: the React app is served by Vite, not by Express.
      command: 'node test/mock-backend/server.js',
      cwd: REPO_ROOT,
      url: `http://localhost:${API_PORT}/api/__test/state`,
      env: { PORT: String(API_PORT), COVERAGE: '0', SERVE_STATIC: '0' },
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: REPO_ROOT,
      url: BASE_URL,
      // COVERAGE=1 switches on the istanbul transform in vite.config.ts, so
      // window.__coverage__ exists for the per-test flush in support/fixtures.ts.
      env: { API_TARGET: `http://localhost:${API_PORT}`, COVERAGE: '1' },
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 120_000,
    },
  ],
});
