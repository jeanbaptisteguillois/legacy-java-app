/**
 * Serve-time Istanbul instrumentation for the React sources — the Vite
 * equivalent of `test/mock-backend/instrument.js`.
 *
 * The AngularJS app had no build system, so the mock backend instrumented
 * `app/**\/*.js` as it served it. React is served by Vite, so instrumentation
 * has to happen in the module pipeline instead. Files on disk are never
 * modified and the plugin is inert unless `COVERAGE=1` is set, so `npm run dev`
 * is unaffected.
 *
 * Coverage keys stay repo-relative POSIX paths ("src/features/..."), matching
 * the convention the coverage report already uses.
 */
import * as path from 'path';
import type { Plugin } from 'vite';

// istanbul-lib-instrument ships no type declarations; the shape used here is
// the same one test/mock-backend/instrument.js relies on.
const { createInstrumenter } = require('istanbul-lib-instrument') as {
  createInstrumenter: (options: Record<string, unknown>) => {
    instrumentSync: (code: string, filename: string) => string;
    lastSourceMap: () => unknown;
  };
};

const INSTRUMENTABLE = /\.(ts|tsx|js|jsx)$/;

export function istanbulCoverage(repoRoot: string): Plugin {
  const enabled = process.env.COVERAGE === '1';
  const srcDir = path.join(repoRoot, 'src') + path.sep;

  const instrumenter = createInstrumenter({
    esModules: true,
    compact: false,
    produceSourceMap: true,
    coverageVariable: '__coverage__',
  });

  return {
    name: 'a2r-istanbul-coverage',
    // Run after @vitejs/plugin-react has turned JSX into plain JS.
    enforce: 'post',
    apply: () => enabled,

    transform(code, id) {
      if (!enabled) return null;
      const file = id.split('?')[0];
      if (!INSTRUMENTABLE.test(file) || !file.startsWith(srcDir)) {
        return null;
      }
      const relative = path.relative(repoRoot, file).split(path.sep).join('/');
      try {
        const instrumented = instrumenter.instrumentSync(code, relative);
        return { code: instrumented, map: instrumenter.lastSourceMap() as never };
      } catch {
        // Never break the app because instrumentation failed.
        return null;
      }
    },
  };
}
