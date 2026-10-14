/** Renders the coverage report from the merged raw coverage after the suite. */
export default async function globalTeardown() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { run } = require('./report-coverage.js');
  try {
    run();
  } catch (err) {
    console.error('Failed to render coverage report:', err);
  }
}
