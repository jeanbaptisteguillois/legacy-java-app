/**
 * Layer 2 — Page Object Model (React implementation).
 *
 * Every CSS selector, DOM structure assumption and framework-specific wait in
 * the suite lives in this folder and nowhere else. The class names, method
 * names and return types are identical to the AngularJS POM — `scenarios/`
 * must not need a single edit — only the bodies differ:
 *
 *   1. routing  — React Router v6 path routes (`/products`) replace `#!/products`
 *   2. settle() — a fetch/render quiescence probe replaces `$http.pendingRequests`
 *   3. data layer (see data-layer-gateway.ts) — `window.__services__` replaces
 *      the AngularJS injector
 *
 * Markup-level selectors are unchanged: the migration preserved the Bootstrap 3
 * class names, the element ids, the table column order and the `[ng-view]`
 * content wrapper.
 */
import { Page, Locator, expect } from '@playwright/test';

/** A backend call observed while a user action was performed. */
export interface ApiCall {
  method: string;
  /** Path + query string, e.g. `/api/orders/1001/status?value=SHIPPED`. */
  path: string;
}

/** How long the app must be free of network + loading activity to count as settled. */
const QUIET_PERIOD_MS = 250;

/**
 * Pages whose quiescence probe has been registered. `addInitScript` only
 * affects *subsequent* navigations, so it is installed before every `goto`.
 */
const PROBED_PAGES = new WeakSet<Page>();

/**
 * Installs the React equivalent of AngularJS' `$http.pendingRequests`.
 *
 * AngularJS funnelled every request through one injectable service that
 * published its in-flight count. React/TanStack Query goes straight to
 * `window.fetch`, so the probe counts in-flight `fetch`/`XMLHttpRequest`
 * calls and records the timestamp of the last network activity.
 */
export async function installQuiescenceProbe(page: Page): Promise<void> {
  if (PROBED_PAGES.has(page)) {
    return;
  }
  PROBED_PAGES.add(page);
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    if (w.__a2rPending__ !== undefined) {
      return;
    }
    w.__a2rPending__ = 0;
    w.__a2rLastActivity__ = Date.now();

    const touch = () => {
      w.__a2rLastActivity__ = Date.now();
    };
    const started = () => {
      w.__a2rPending__ = (w.__a2rPending__ as number) + 1;
      touch();
    };
    const finished = () => {
      w.__a2rPending__ = Math.max(0, (w.__a2rPending__ as number) - 1);
      touch();
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args: Parameters<typeof fetch>) => {
      started();
      return originalFetch(...args).then(
        (response) => {
          finished();
          return response;
        },
        (error) => {
          finished();
          throw error;
        }
      );
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function patchedSend(
      this: XMLHttpRequest,
      ...args: unknown[]
    ) {
      started();
      this.addEventListener('loadend', finished);
      // eslint-disable-next-line prefer-spread
      return originalSend.apply(this, args as never);
    } as typeof XMLHttpRequest.prototype.send;
  });
}

/**
 * True when React has mounted, no request is in flight, nothing has happened on
 * the network for `QUIET_PERIOD_MS`, and no "Loading …" placeholder is on screen.
 *
 * The quiet period is what makes this equivalent to the AngularJS probe: a
 * mutation that navigates (save → `/products`) kicks off a *second* request from
 * the newly mounted route, and this prevents settling in the gap between them.
 */
function isQuiescent(quietPeriodMs: number): boolean {
  const w = window as unknown as Record<string, unknown>;
  const root = document.getElementById('root');
  if (!root || root.childElementCount === 0) {
    return false;
  }
  if (((w.__a2rPending__ as number) || 0) > 0) {
    return false;
  }
  const lastActivity = (w.__a2rLastActivity__ as number) || 0;
  if (Date.now() - lastActivity < quietPeriodMs) {
    return false;
  }
  return !Array.from(document.querySelectorAll('[ng-view] div')).some((element) =>
    /^Loading .+\.\.\.$/.test((element.textContent || '').trim())
  );
}

/** Waits for the running React app to go quiet. Throws if it never does. */
export async function waitForQuiescence(page: Page): Promise<void> {
  await page.waitForFunction(isQuiescent, QUIET_PERIOD_MS);
}

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** React Router path this page lives on. */
  protected abstract readonly route: string;
  /** Noun used by the page's "Loading …" indicator. */
  protected abstract readonly loadingNoun: string;

  // ---------------------------------------------------------------- selectors
  protected rows(): Locator {
    return this.page.locator('table tbody tr');
  }

  protected table(): Locator {
    return this.page.locator('table');
  }

  protected errorBanner(): Locator {
    return this.page.locator('.alert-danger');
  }

  protected loadingIndicator(): Locator {
    return this.page.locator('div', {
      hasText: new RegExp(`^Loading ${this.loadingNoun}\\.\\.\\.$`),
    });
  }

  // --------------------------------------------------------------- navigation
  /** Opens the page and waits until its data has finished loading. */
  async open(): Promise<void> {
    await this.navigateTo(this.route);
    await this.settle();
  }

  /**
   * Opens the page and returns as soon as the document is parsed, without
   * waiting for backend data — used to observe transient loading states.
   */
  async openWithoutWaitingForData(): Promise<void> {
    await this.load(this.route);
  }

  protected async navigateTo(route: string): Promise<void> {
    await this.load(route);
    await expect(this.page.locator('[ng-view] h2').first()).toBeVisible();
    await this.settle();
  }

  /**
   * Browser-level load of a React Router path. The AngularJS POM could flip
   * `location.hash` to move around without a reload; with path routing a real
   * navigation is both simpler and a stronger test (every route must survive a
   * cold load).
   */
  protected async load(route: string): Promise<void> {
    await installQuiescenceProbe(this.page);
    await this.page.goto(route, { waitUntil: 'domcontentloaded' });
  }

  /** Waits until the framework has no in-flight requests and has re-rendered. */
  async settle(): Promise<void> {
    await waitForQuiescence(this.page);
  }

  // ------------------------------------------------------------- page content
  async heading(): Promise<string> {
    const heading = this.page.locator('h2').first();
    await heading.waitFor({ state: 'visible' });
    return (await heading.innerText()).trim();
  }

  /** The error message shown to the user. Throws when there is none. */
  async errorMessage(): Promise<string> {
    const banner = this.errorBanner();
    await banner.first().waitFor({ state: 'visible' });
    return (await banner.first().innerText()).trim();
  }

  /** True when no error is being shown at all. */
  async isFreeOfErrors(): Promise<boolean> {
    await expect(this.errorBanner()).toHaveCount(0);
    return true;
  }

  async loadingIndicatorIsVisible(): Promise<boolean> {
    await this.loadingIndicator().last().waitFor({ state: 'visible' });
    return true;
  }

  async loadingIndicatorIsGone(): Promise<boolean> {
    await expect(this.loadingIndicator()).toHaveCount(0);
    return true;
  }

  /** Waits for the records table to be on screen. Throws when it never is. */
  async recordTableIsVisible(): Promise<boolean> {
    await this.table().first().waitFor({ state: 'visible' });
    return true;
  }

  /** Immediate check — no waiting — used to assert the table is not yet shown. */
  async isRecordTableRendered(): Promise<boolean> {
    return (await this.table().count()) > 0;
  }

  async recordCount(): Promise<number> {
    return this.rows().count();
  }

  // --------------------------------------------------------------- user input
  /** Captures the backend call a user action triggers. */
  protected async capture(
    pattern: RegExp,
    action: () => Promise<unknown>
  ): Promise<ApiCall> {
    const [request] = await Promise.all([
      this.page.waitForRequest((r) => pattern.test(new URL(r.url()).pathname)),
      action(),
    ]);
    await this.settle();
    const url = new URL(request.url());
    return { method: request.method(), path: `${url.pathname}${url.search}` };
  }

  /**
   * Performs an action and reports whether any backend call matching `pattern`
   * was issued within `graceMs`. Used to prove a call is *not* made.
   */
  protected async captureNothing(
    pattern: RegExp,
    action: () => Promise<unknown>,
    graceMs = 1500
  ): Promise<boolean> {
    let seen = false;
    const listener = (r: { url: () => string }) => {
      if (pattern.test(new URL(r.url()).pathname)) seen = true;
    };
    this.page.on('request', listener as never);
    try {
      await action();
      await this.page.waitForTimeout(graceMs);
      await this.settle();
    } finally {
      this.page.off('request', listener as never);
    }
    return !seen;
  }

  protected acceptNextConfirmation(): void {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  protected declineNextConfirmation(): void {
    this.page.once('dialog', (dialog) => dialog.dismiss());
  }
}
