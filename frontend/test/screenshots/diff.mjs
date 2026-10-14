/**
 * Pixel-diffs react.png against angular.png for every captured route.
 *
 * Usage: node test/screenshots/diff.mjs [--max=0.30]
 *
 * Images of differing size are compared on a common canvas sized to the max
 * width/height of the pair; unmatched padding counts as differing pixels so a
 * layout/height change can never be silently ignored.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Route list mirrors test/screenshots/capture.mjs. It is duplicated rather than
// imported because capture.mjs runs its capture on import (no main guard).
const ROUTES = [
  { slug: 'dashboard', route: '/dashboard' },
  { slug: 'products', route: '/products' },
  { slug: 'products-new', route: '/products/new' },
  { slug: 'products-detail', route: '/products/1' },
  { slug: 'customers', route: '/customers' },
  { slug: 'customers-new', route: '/customers/new' },
  { slug: 'customers-detail', route: '/customers/1' },
  { slug: 'orders', route: '/orders' },
  { slug: 'orders-new', route: '/orders/new' },
  { slug: 'invoices', route: '/invoices' },
  { slug: 'notifications', route: '/notifications' },
];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? 'true' : v];
  })
);

const MAX_RATIO = Number(args.max ?? 0.3);
const OUT_ROOT = path.resolve(args.out || '.a2r/screenshots');

/** Copies src pixels into a blank canvas of the given size (top-left anchored). */
function pad(src, width, height) {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  out.data.fill(0);
  PNG.bitblt(src, out, 0, 0, src.width, src.height, 0, 0);
  return out;
}

const rows = [];
let missing = 0;

for (const { slug, route } of ROUTES) {
  const dir = path.join(OUT_ROOT, slug);
  const aPath = path.join(dir, 'angular.png');
  const rPath = path.join(dir, 'react.png');

  if (!existsSync(aPath) || !existsSync(rPath)) {
    rows.push({ slug, route, ratio: null, note: !existsSync(aPath) ? 'angular.png MISSING' : 'react.png MISSING' });
    missing++;
    continue;
  }

  const a = PNG.sync.read(readFileSync(aPath));
  const r = PNG.sync.read(readFileSync(rPath));
  const width = Math.max(a.width, r.width);
  const height = Math.max(a.height, r.height);
  const ap = pad(a, width, height);
  const rp = pad(r, width, height);

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(ap.data, rp.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });
  const ratio = diffPixels / (width * height);

  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'diff.png'), PNG.sync.write(diff));

  rows.push({
    slug,
    route,
    ratio,
    diffPixels,
    dims: `${a.width}x${a.height} vs ${r.width}x${r.height}`,
    sizeMismatch: a.width !== r.width || a.height !== r.height,
    pass: ratio < MAX_RATIO,
  });
}

const pad2 = (s, n) => String(s).padEnd(n);
console.log(`\nmaxDiffPixelRatio = ${MAX_RATIO}\n`);
console.log(`${pad2('slug', 20)}${pad2('route', 18)}${pad2('ratio', 12)}${pad2('diff px', 12)}${pad2('dims (a vs r)', 26)}verdict`);
console.log('-'.repeat(98));
for (const row of rows) {
  if (row.ratio === null) {
    console.log(`${pad2(row.slug, 20)}${pad2(row.route, 18)}${pad2('n/a', 12)}${pad2('-', 12)}${pad2('-', 26)}FAIL (${row.note})`);
    continue;
  }
  console.log(
    `${pad2(row.slug, 20)}${pad2(row.route, 18)}${pad2(row.ratio.toFixed(6), 12)}${pad2(row.diffPixels, 12)}${pad2(row.dims + (row.sizeMismatch ? ' !' : ''), 26)}${row.pass ? 'PASS' : 'FAIL'}`
  );
}

const failures = rows.filter((r) => r.ratio === null || !r.pass);
console.log('-'.repeat(98));
console.log(`\n${rows.length - failures.length}/${rows.length} routes passed.`);
if (failures.length) {
  console.log(`FAILING: ${failures.map((f) => f.slug).join(', ')}`);
  process.exit(1);
}
console.log('VERDICT: PASS');
