# test/domain — two-layer behavioural suite

Re-run (collects coverage end-to-end into `.a2r/coverage-raw.json` and renders
`.a2r/coverage-summary.json` + `coverage/`):

```
npx playwright test --config=test/domain/playwright.config.ts
```

## Layers

| Path | Layer | Contains | Survives the React migration? |
|---|---|---|---|
| `scenarios/` | 1 — behaviour | Given/When/Then specs in business language, zero selectors | yes — unchanged, byte for byte |
| `pom/` | 2 — Page Object Model | every CSS selector, DOM assumption and framework wait | no — ported to React in place (same classes, methods, return types) |
| `support/fixtures.ts` | harness | mock-backend control plane (dataset reset, failure injection, latency) + per-test coverage flush | yes, unchanged |
| `playwright.config.ts`, `coverage-utils.ts`, `global-setup.ts`, `global-teardown.ts`, `report-coverage.js`, `vite-istanbul.ts` | instrumentation | istanbul coverage collection | yes (the config now boots two servers) |

## Servers

The AngularJS run used one Express process for both `/api` and the static app.
React needs two, both started automatically by `playwright.config.ts`:

| Server | Port | Command |
|---|---|---|
| mock backend (`/api`) | 4310 | `PORT=4310 SERVE_STATIC=0 node test/mock-backend/server.js` |
| Vite dev server (React app, proxies `/api` → 4310) | 5173 | `npm run dev` |

Coverage is collected by `test/domain/vite-istanbul.ts`, a Vite `transform`
plugin that instruments `src/**` in memory when `COVERAGE=1` — the module-pipeline
equivalent of the mock backend's serve-time instrumentation of `app/**/*.js`.

## The React POM port

Class names, method names and return types in `pom/` are unchanged; only the
three framework-coupled spots were rewritten:

- `BasePage.load` / `navigateTo` / `open*` — hashbang `#!/route` became the
  React Router v6 path (`/products`), so every route is exercised as a real
  cold load.
- `BasePage.settle()` — `$http.pendingRequests` became a quiescence probe
  installed with `addInitScript`: it counts in-flight `fetch`/`XMLHttpRequest`
  calls and requires 250 ms of network silence plus no `Loading …` placeholder.
  The quiet period is what makes it equivalent — a mutation that navigates
  (save → `/products`) starts a *second* request from the newly mounted route,
  and the probe refuses to settle in the gap between the two.
- `DataLayerGateway.invoke()` — `injector.get('ProductService')` became
  `window.__services__.ProductService` (published by `src/services/registry.ts`).
  The services kept the `$http` contract (`{ status, data }` on resolve, the
  same two fields on an `HttpError` rejection), so the normalisation is unchanged.

Selectors needed no changes: the migration preserved the Bootstrap 3 class
names (`btn-default`, `btn-danger`, `label-success`, `tr.danger`), the element
ids (`#sku`, `#generateOrderId`, …), the table column order and the `[ng-view]`
content wrapper.

Rules that must hold in any POM implementation:

- methods throw when an element is missing — no `.catch(() => false)`, no
  `if (visible)` guards;
- methods that trigger a backend call return an `ApiCall` (`{ method, path }`)
  captured with `waitForRequest`, so scenarios can prove the call fired;
- `captureNothing()` is the only "no call" path and it asserts absence explicitly.
