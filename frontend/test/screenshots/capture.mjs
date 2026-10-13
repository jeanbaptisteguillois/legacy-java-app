/**
 * Reusable screenshot capture for Angular (baseline) and React (comparison).
 *
 * Usage:
 *   node test/screenshots/capture.mjs --app=angular
 *   node test/screenshots/capture.mjs --app=react --base=http://localhost:5173 --routing=path
 *
 * Identical viewport, routes, wait strategy and backend state reset for both
 * apps. The only difference is URL construction: AngularJS uses hashbang
 * (#!/dashboard), React uses path routing (/dashboard).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? 'true' : v];
  })
);

const APP = args.app || 'angular';
const ROUTING = args.routing || (APP === 'angular' ? 'hash' : 'path');
const BASE = (args.base || process.env.BASE_URL || 'http://localhost:4310').replace(/\/$/, '');
// The mock backend always owns /api, even when the UI is served elsewhere.
const API = (args.api || process.env.API_URL || 'http://localhost:4310').replace(/\/$/, '');
const OUT_ROOT = path.resolve(args.out || '.a2r/screenshots');

export const VIEWPORT = { width: 1440, height: 900 };
export const SETTLE_MS = 3000;

// Seeded ids from test/mock-backend/data.js (default dataset).
const SEEDED_PRODUCT_ID = 1;
const SEEDED_CUSTOMER_ID = 1;

export const ROUTES = [
  { slug: 'dashboard', route: '/dashboard' },
  { slug: 'products', route: '/products' },
  { slug: 'products-new', route: '/products/new' },
  { slug: 'products-detail', route: `/products/${SEEDED_PRODUCT_ID}` },
  { slug: 'customers', route: '/customers' },
  { slug: 'customers-new', route: '/customers/new' },
  { slug: 'customers-detail', route: `/customers/${SEEDED_CUSTOMER_ID}` },
  { slug: 'orders', route: '/orders' },
  { slug: 'orders-new', route: '/orders/new' },
  { slug: 'invoices', route: '/invoices' },
  { slug: 'notifications', route: '/notifications' },
];

const url = (route) => (ROUTING === 'hash' ? `${BASE}/#!${route}` : `${BASE}${route}`);

async function resetBackend() {
  const res = await fetch(`${API}/api/__test/reset?dataset=default`, { method: 'POST' });
  if (!res.ok) throw new Error(`backend reset failed: ${res.status}`);
}

/** Waits until data has rendered: no spinners/loading text and network quiet. */
async function waitForData(page) {
  await page.waitForLoadState('networkidle');
  await page
    .waitForFunction(
      () => {
        const txt = document.body.innerText || '';
        if (/Loading|Please wait/i.test(txt)) return false;
        if (document.querySelector('.spinner, .loading, [class*="spinner"]')) return false;
        return txt.trim().length > 0;
      },
      undefined,
      { timeout: 20000 }
    )
    .catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
}

async function main() {
  const browser = await chromium.launch();
  const captured = [];
  try {
    for (const { slug, route } of ROUTES) {
      // Fresh context per route so client state never leaks between shots.
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await resetBackend();
      await page.goto(url(route), { waitUntil: 'load' });
      await waitForData(page);

      const dir = path.join(OUT_ROOT, slug);
      mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${APP}.png`);
      await page.screenshot({ path: file, fullPage: true });
      captured.push({ route, file });
      console.log(`captured ${route} -> ${path.relative(process.cwd(), file)}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`\n${captured.length}/${ROUTES.length} routes captured for "${APP}".`);
  if (captured.length !== ROUTES.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
