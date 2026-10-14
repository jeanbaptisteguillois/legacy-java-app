/**
 * Test harness shared by every scenario.
 *
 * This file is deliberately free of any UI/DOM knowledge: it only wires up
 *   - the backend control plane (dataset reset, failure injection, latency)
 *   - per-test coverage flushing
 * so it survives the Angular -> React swap unchanged.
 */
import { test as base, expect, APIRequestContext } from '@playwright/test';
import { flushCoverage } from '../coverage-utils';

export type Dataset = 'default' | 'empty';

export interface FailureRule {
  method?: string;
  path: string;
  status?: number;
  body?: unknown;
  delayMs?: number;
  times?: number;
}

/** Control plane of the mock backend — the system under test's data layer. */
export class Backend {
  constructor(private readonly request: APIRequestContext) {}

  async reset(dataset: Dataset = 'default') {
    const res = await this.request.post('/api/__test/reset', { data: { dataset } });
    expect(res.ok()).toBeTruthy();
  }

  async failures(rules: FailureRule[]) {
    const res = await this.request.post('/api/__test/failures', { data: { rules } });
    expect(res.ok()).toBeTruthy();
  }

  async clearFailures() {
    await this.request.delete('/api/__test/failures');
  }

  /** Makes every backend call take `ms` — used to observe loading states. */
  async delay(ms: number) {
    await this.request.post('/api/__test/delay', { data: { ms } });
  }

  async state(): Promise<{ counts: Record<string, number> }> {
    const res = await this.request.get('/api/__test/state');
    return res.json();
  }
}

export const test = base.extend<{ backend: Backend }>({
  // `auto` is essential: every scenario must start from a known dataset with
  // no leftover failure rules, even when it never touches `backend` itself.
  backend: [
    async ({ request }, use) => {
      const backend = new Backend(request);
      await backend.reset('default');
      await use(backend);
      await backend.reset('default');
    },
    { auto: true },
  ],

  // Flush window.__coverage__ to .a2r/coverage-raw.json after every scenario.
  page: async ({ page }, use) => {
    await use(page);
    await flushCoverage(page);
  },
});

export { expect };
