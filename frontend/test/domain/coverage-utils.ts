/**
 * Coverage persistence helpers.
 *
 * Rules enforced here:
 *   - never accumulate coverage in a module-level variable (lost per worker)
 *   - always read-merge-write .a2r/coverage-raw.json on disk
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const A2R_DIR = path.join(REPO_ROOT, '.a2r');
export const RAW_COVERAGE_FILE = path.join(A2R_DIR, 'coverage-raw.json');

type FileCoverage = {
  path: string;
  statementMap: Record<string, unknown>;
  fnMap: Record<string, unknown>;
  branchMap: Record<string, unknown>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
};

type CoverageMap = Record<string, FileCoverage>;

function addCounters(target: Record<string, number>, source: Record<string, number>) {
  for (const key of Object.keys(source || {})) {
    target[key] = (target[key] || 0) + (source[key] || 0);
  }
}

function addBranchCounters(target: Record<string, number[]>, source: Record<string, number[]>) {
  for (const key of Object.keys(source || {})) {
    const incoming = source[key] || [];
    const existing = target[key] || [];
    const merged: number[] = [];
    for (let i = 0; i < Math.max(existing.length, incoming.length); i += 1) {
      merged[i] = (existing[i] || 0) + (incoming[i] || 0);
    }
    target[key] = merged;
  }
}

/** Deep-merges a coverage map into the on-disk raw file (read-merge-write). */
export function mergeIntoRawFile(incoming: CoverageMap | null | undefined): void {
  if (!incoming || Object.keys(incoming).length === 0) {
    return;
  }
  fs.mkdirSync(A2R_DIR, { recursive: true });

  let existing: CoverageMap = {};
  if (fs.existsSync(RAW_COVERAGE_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(RAW_COVERAGE_FILE, 'utf8')) as CoverageMap;
    } catch {
      existing = {};
    }
  }

  for (const file of Object.keys(incoming)) {
    const next = incoming[file];
    const prev = existing[file];
    if (!prev) {
      existing[file] = JSON.parse(JSON.stringify(next));
      continue;
    }
    addCounters(prev.s, next.s);
    addCounters(prev.f, next.f);
    addBranchCounters(prev.b, next.b);
    // Keep maps (they are identical for the same instrumented source).
    prev.statementMap = prev.statementMap || next.statementMap;
    prev.fnMap = prev.fnMap || next.fnMap;
    prev.branchMap = prev.branchMap || next.branchMap;
  }

  fs.writeFileSync(RAW_COVERAGE_FILE, JSON.stringify(existing), 'utf8');
}

/** Pulls window.__coverage__ out of a live page and persists it. */
export async function flushCoverage(page: Page): Promise<void> {
  if (page.isClosed()) {
    return;
  }
  try {
    const coverage = await page.evaluate(() => (window as any).__coverage__ || null);
    mergeIntoRawFile(coverage as CoverageMap);
  } catch {
    // Page navigated away / context torn down: nothing to collect.
  }
}

export function deleteRawCoverage(): void {
  if (fs.existsSync(RAW_COVERAGE_FILE)) {
    fs.rmSync(RAW_COVERAGE_FILE);
  }
}
