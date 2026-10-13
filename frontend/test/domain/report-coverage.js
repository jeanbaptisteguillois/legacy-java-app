/**
 * Turns .a2r/coverage-raw.json into human + machine readable reports:
 *   - text summary on stdout
 *   - coverage/ (lcov + html)
 *   - .a2r/coverage-summary.json
 *
 * Usable standalone: `node test/domain/report-coverage.js`
 */
'use strict';

var fs = require('fs');
var path = require('path');

var libCoverage = require('istanbul-lib-coverage');
var reports = require('istanbul-reports');
var libReport = require('istanbul-lib-report');

var REPO_ROOT = path.resolve(__dirname, '..', '..');
var RAW = path.join(REPO_ROOT, '.a2r', 'coverage-raw.json');
var OUT_DIR = path.join(REPO_ROOT, 'coverage');
var SUMMARY_FILE = path.join(REPO_ROOT, '.a2r', 'coverage-summary.json');

function pct(part) {
    return part.total === 0 ? 100 : Math.round((part.covered / part.total) * 10000) / 100;
}

function run() {
    if (!fs.existsSync(RAW)) {
        console.error('No coverage data at ' + RAW + ' — run the Playwright suite first.');
        process.exit(1);
    }

    var raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
    var map = libCoverage.createCoverageMap(raw);

    var context = libReport.createContext({
        dir: OUT_DIR,
        coverageMap: map,
        defaultSummarizer: 'flat'
    });
    reports.create('text', { maxCols: 140 }).execute(context);
    reports.create('lcovonly').execute(context);
    reports.create('html').execute(context);

    var totals = map.getCoverageSummary();
    var summary = {
        generatedAt: new Date().toISOString(),
        files: map.files().length,
        lines: { pct: pct(totals.lines), covered: totals.lines.covered, total: totals.lines.total },
        statements: {
            pct: pct(totals.statements),
            covered: totals.statements.covered,
            total: totals.statements.total
        },
        branches: {
            pct: pct(totals.branches),
            covered: totals.branches.covered,
            total: totals.branches.total
        },
        functions: {
            pct: pct(totals.functions),
            covered: totals.functions.covered,
            total: totals.functions.total
        },
        perFile: {}
    };

    map.files().forEach(function (file) {
        var fileSummary = map.fileCoverageFor(file).toSummary();
        summary.perFile[file] = {
            lines: pct(fileSummary.lines),
            branches: pct(fileSummary.branches),
            uncoveredLines: map.fileCoverageFor(file).getUncoveredLines()
        };
    });

    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), 'utf8');

    console.log('');
    console.log('=== COVERAGE TOTALS (app/**/*.js) ===');
    console.log('Lines    : ' + summary.lines.pct + '% (' + summary.lines.covered + '/' + summary.lines.total + ')');
    console.log('Branches : ' + summary.branches.pct + '% (' + summary.branches.covered + '/' + summary.branches.total + ')');
    console.log('Functions: ' + summary.functions.pct + '% (' + summary.functions.covered + '/' + summary.functions.total + ')');
    console.log('Statements: ' + summary.statements.pct + '% (' + summary.statements.covered + '/' + summary.statements.total + ')');
    console.log('');

    var threshold = Number(process.env.COVERAGE_THRESHOLD || 70);
    if (summary.lines.pct < threshold || summary.branches.pct < threshold) {
        console.error('Coverage below threshold of ' + threshold + '%.');
        if (process.env.COVERAGE_ENFORCE === '1') {
            process.exit(2);
        }
    }
    return summary;
}

if (require.main === module) {
    run();
}

module.exports = { run: run };
