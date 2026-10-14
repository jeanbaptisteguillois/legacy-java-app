/**
 * Serve-time Istanbul instrumentation for app/**\/*.js.
 *
 * The legacy app has no build system, so instead of hand-editing any source
 * file we instrument the controller/service JS on the fly as it is served.
 * The files on disk are never modified; `lib/` and `css/` are served verbatim.
 *
 * Coverage keys are repo-relative POSIX paths (e.g. "app/product/product-list.controller.js")
 * so the final report reads naturally.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var createInstrumenter = require('istanbul-lib-instrument').createInstrumenter;

var instrumenter = createInstrumenter({
    esModules: false,
    compact: false,
    produceSourceMap: false,
    coverageVariable: '__coverage__'
});

var cache = Object.create(null);

/**
 * Express middleware that instruments any request resolving to a file under
 * `app/` with a `.js` extension. Everything else falls through.
 */
function instrumentAppJs(repoRoot, options) {
    var enabled = !options || options.enabled !== false;

    return function (req, res, next) {
        if (!enabled) {
            return next();
        }

        var urlPath = decodeURIComponent(req.path);
        if (!/^\/app\/.+\.js$/.test(urlPath)) {
            return next();
        }

        var relative = urlPath.replace(/^\//, '');
        var absolute = path.join(repoRoot, relative);

        // Guard against path traversal outside the repo root.
        if (absolute.indexOf(path.join(repoRoot, 'app') + path.sep) !== 0) {
            return next();
        }

        fs.stat(absolute, function (statErr, stat) {
            if (statErr || !stat.isFile()) {
                return next();
            }

            var cached = cache[absolute];
            if (cached && cached.mtimeMs === stat.mtimeMs) {
                return send(res, cached.code);
            }

            fs.readFile(absolute, 'utf8', function (readErr, source) {
                if (readErr) {
                    return next(readErr);
                }
                var code;
                try {
                    code = instrumenter.instrumentSync(source, relative.split(path.sep).join('/'));
                } catch (e) {
                    // Never break the app because instrumentation failed.
                    code = source;
                }
                cache[absolute] = { mtimeMs: stat.mtimeMs, code: code };
                send(res, code);
            });
        });
    };
}

function send(res, code) {
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(code);
}

module.exports = { instrumentAppJs: instrumentAppJs };
