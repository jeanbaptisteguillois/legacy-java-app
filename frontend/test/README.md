# Mock backend + coverage suite

Two self-contained pieces of dev tooling for the legacy AngularJS 1.5 SPA.
**Nothing under `app/`, `index.html`, `css/` or `lib/` is modified** — the app is
instrumented at serve time, so it keeps working exactly as before when opened
any other way.

## `test/mock-backend/`

A standalone Express server that does two jobs:

1. **Serves every `/api` endpoint** from `.a2r/pre-analysis.json` `api_surface`
   with stateful, in-memory data (`data.js` holds the seed). State mutates
   realistically: placing an order decrements stock and emits a notification,
   cancelling restocks, invoices can only be generated once per order, etc.
2. **Hosts the AngularJS static app** from the repo root so Playwright drives
   the real UI on a single origin. `instrument.js` Istanbul-instruments every
   `app/**/*.js` response on the fly; `lib/`, `css/` and the templates are
   served verbatim.

### Test control endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/__test/reset` `{dataset:'default'\|'empty'}` | Full state reset (test isolation) |
| `POST /api/__test/failures` `{rules:[...]}` | Inject failures: `{method, path (regex), status, body, delayMs, times}` |
| `DELETE /api/__test/failures` | Clear injected failures |
| `POST /api/__test/delay` `{ms}` | Global latency, keeps `vm.loading` states observable |
| `GET /api/__test/state` | Dataset + row counts (also the webServer readiness probe) |

### Running it on its own

```bash
npm run mock-backend                       # app + API on http://localhost:4300
PORT=5000 npm run mock-backend             # different port
COVERAGE=0 npm run mock-backend            # serve app un-instrumented
SERVE_STATIC=0 npm run mock-backend        # API only
```

## `test/coverage/`

Playwright suite (71 tests, `workers: 1`) covering every route and every
controller branch: empty states, loading states, error paths, form validation,
create/update/delete, order status transitions and the `otherwise` redirect.

Coverage is read from `window.__coverage__` after **every** test and
deep-merged into `.a2r/coverage-raw.json` on disk (read-merge-write — never
accumulated in a module variable). `global-setup` deletes stale raw coverage;
`global-teardown` renders the report.

### Running

```bash
npx playwright test --config=test/coverage/playwright.config.ts
# or
npm run test:coverage
```

The config has a `webServer` block, so this is fully self-contained — it boots
the mock backend itself on port 4310. First time only:
`npm install && npx playwright install chromium`.

### Outputs

- `.a2r/coverage-raw.json` — merged raw Istanbul data
- `.a2r/coverage-summary.json` — totals + per-file lines/branches/uncovered lines
- `coverage/` — lcov + browsable HTML report
- text summary on stdout

Re-render a report from existing raw data without re-running the browser:

```bash
npm run coverage:report
```

Set `COVERAGE_ENFORCE=1` (and optionally `COVERAGE_THRESHOLD=70`) to make the
reporter exit non-zero below the threshold.
