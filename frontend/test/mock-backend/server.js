/**
 * Standalone Express mock backend for the legacy AngularJS Inventory & Order
 * Management SPA.
 *
 * Responsibilities
 *   1. Serve every endpoint in .a2r/pre-analysis.json `api_surface` under /api
 *      with realistic, STATEFUL in-memory data.
 *   2. Serve the AngularJS static app from the repo root (index.html, app/,
 *      css/, lib/) so Playwright can drive the real UI on one origin.
 *   3. Expose test-only control endpoints (/api/__test/*) for isolation:
 *      dataset reset, empty dataset, injected failures and latency.
 *
 * Nothing under app/, css/, lib/ or index.html is ever modified on disk; the
 * app/*.js files are Istanbul-instrumented at serve time (see instrument.js).
 *
 * Usage:
 *   node test/mock-backend/server.js                 # app + api on :4300
 *   PORT=5000 node test/mock-backend/server.js
 *   COVERAGE=0 node test/mock-backend/server.js      # no instrumentation
 *   SERVE_STATIC=0 node test/mock-backend/server.js  # API only
 */
'use strict';

var path = require('path');
var express = require('express');
var cors = require('cors');

var data = require('./data');
var instrument = require('./instrument');

var REPO_ROOT = path.resolve(__dirname, '..', '..');
var PORT = parseInt(process.env.PORT, 10) || 4300;
var SERVE_STATIC = process.env.SERVE_STATIC !== '0';
var COVERAGE = process.env.COVERAGE !== '0';

var state = data.createState('default');
/** Injected failure rules: { method, path (prefix or regex source), status, body, delayMs, times }. */
var failureRules = [];
/** Global artificial latency applied to every /api response, in ms. */
var globalDelayMs = 0;

var app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ type: 'text/*' }));

/* ------------------------------------------------------------------ helpers */

function nextId(kind) {
    state.sequences[kind] += 1;
    return state.sequences[kind];
}

function withLowStock(product) {
    var copy = data.clone(product);
    copy.lowStock = copy.quantityOnHand <= copy.reorderThreshold;
    return copy;
}

function findById(collection, id) {
    var numeric = parseInt(id, 10);
    for (var i = 0; i < collection.length; i += 1) {
        if (collection[i].id === numeric) {
            return collection[i];
        }
    }
    return null;
}

function indexById(collection, id) {
    var numeric = parseInt(id, 10);
    for (var i = 0; i < collection.length; i += 1) {
        if (collection[i].id === numeric) {
            return i;
        }
    }
    return -1;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function sendLater(res, fn) {
    if (globalDelayMs > 0) {
        setTimeout(fn, globalDelayMs);
    } else {
        fn();
    }
}

/* ------------------------------------------- test control + failure injection */

var testRouter = express.Router();

// Reset all state. body/query: { dataset: 'default' | 'empty' }
testRouter.all('/reset', function (req, res) {
    var dataset = (req.body && req.body.dataset) || req.query.dataset || 'default';
    state = data.createState(dataset === 'empty' ? 'empty' : 'default');
    failureRules = [];
    globalDelayMs = 0;
    res.json({ ok: true, dataset: state.dataset });
});

// Install failure rules. body: { rules: [{ method, path, status, body, delayMs, times }] }
testRouter.post('/failures', function (req, res) {
    var rules = (req.body && req.body.rules) || [];
    failureRules = rules.map(function (rule) {
        return {
            method: (rule.method || 'GET').toUpperCase(),
            path: rule.path,
            status: rule.status || 500,
            body: rule.body,
            delayMs: rule.delayMs || 0,
            times: typeof rule.times === 'number' ? rule.times : Infinity
        };
    });
    res.json({ ok: true, rules: failureRules.length });
});

testRouter.delete('/failures', function (req, res) {
    failureRules = [];
    res.json({ ok: true });
});

// Set global latency so the app's `loading` states stay observable.
testRouter.post('/delay', function (req, res) {
    globalDelayMs = (req.body && req.body.ms) || 0;
    res.json({ ok: true, ms: globalDelayMs });
});

testRouter.get('/state', function (req, res) {
    res.json({
        dataset: state.dataset,
        counts: {
            products: state.products.length,
            customers: state.customers.length,
            orders: state.orders.length,
            invoices: state.invoices.length,
            notifications: state.notifications.length
        },
        failureRules: failureRules.length,
        globalDelayMs: globalDelayMs
    });
});

app.use('/api/__test', testRouter);

/** Applies any matching injected failure before the real handler runs. */
app.use('/api', function (req, res, next) {
    if (req.path.indexOf('/__test') === 0) {
        return next();
    }
    var target = '/api' + req.path;
    for (var i = 0; i < failureRules.length; i += 1) {
        var rule = failureRules[i];
        if (rule.times <= 0) {
            continue;
        }
        if (rule.method !== 'ANY' && rule.method !== req.method) {
            continue;
        }
        var matches;
        try {
            matches = new RegExp(rule.path).test(target);
        } catch (e) {
            matches = target.indexOf(rule.path) === 0;
        }
        if (!matches) {
            continue;
        }
        rule.times -= 1;
        var respond = function () {
            if (rule.body === undefined || rule.body === null) {
                res.status(rule.status).end();
            } else if (typeof rule.body === 'string') {
                res.status(rule.status).type('text/plain').send(rule.body);
            } else {
                res.status(rule.status).json(rule.body);
            }
        };
        return rule.delayMs > 0 ? setTimeout(respond, rule.delayMs) : respond();
    }
    next();
});

/* --------------------------------------------------------------- products */

app.get('/api/products', function (req, res) {
    sendLater(res, function () {
        var list = state.products.map(withLowStock);
        if (req.query.q) {
            var q = String(req.query.q).toLowerCase();
            list = list.filter(function (p) {
                return p.name.toLowerCase().indexOf(q) !== -1 ||
                    p.sku.toLowerCase().indexOf(q) !== -1;
            });
        }
        res.json(list);
    });
});

app.get('/api/products/low-stock', function (req, res) {
    sendLater(res, function () {
        res.json(state.products.map(withLowStock).filter(function (p) {
            return p.lowStock;
        }));
    });
});

app.get('/api/products/:id', function (req, res) {
    var product = findById(state.products, req.params.id);
    sendLater(res, function () {
        if (!product) {
            return res.status(404).type('text/plain').send('No product with id ' + req.params.id);
        }
        res.json(withLowStock(product));
    });
});

app.post('/api/products', function (req, res) {
    var body = req.body || {};
    sendLater(res, function () {
        if (!body.sku || !body.name) {
            return res.status(400).type('text/plain').send('sku and name are required');
        }
        var duplicate = state.products.some(function (p) {
            return p.sku === body.sku;
        });
        if (duplicate) {
            return res.status(409).type('text/plain').send('Duplicate SKU ' + body.sku);
        }
        var created = {
            id: nextId('product'),
            sku: body.sku,
            name: body.name,
            description: body.description || '',
            unitPrice: Number(body.unitPrice) || 0,
            quantityOnHand: Number(body.quantityOnHand) || 0,
            reorderThreshold: Number(body.reorderThreshold) || 0
        };
        state.products.push(created);
        res.status(201).json(withLowStock(created));
    });
});

app.put('/api/products/:id', function (req, res) {
    var product = findById(state.products, req.params.id);
    var body = req.body || {};
    sendLater(res, function () {
        if (!product) {
            return res.status(404).type('text/plain').send('No product with id ' + req.params.id);
        }
        ['sku', 'name', 'description'].forEach(function (key) {
            if (body[key] !== undefined) {
                product[key] = body[key];
            }
        });
        ['unitPrice', 'quantityOnHand', 'reorderThreshold'].forEach(function (key) {
            if (body[key] !== undefined) {
                product[key] = Number(body[key]) || 0;
            }
        });
        res.json(withLowStock(product));
    });
});

app.delete('/api/products/:id', function (req, res) {
    var idx = indexById(state.products, req.params.id);
    sendLater(res, function () {
        if (idx === -1) {
            return res.status(404).type('text/plain').send('No product with id ' + req.params.id);
        }
        var removed = state.products.splice(idx, 1)[0];
        res.json({ deleted: removed.id });
    });
});

/* -------------------------------------------------------------- customers */

app.get('/api/customers', function (req, res) {
    sendLater(res, function () {
        res.json(data.clone(state.customers));
    });
});

app.get('/api/customers/:id', function (req, res) {
    var customer = findById(state.customers, req.params.id);
    sendLater(res, function () {
        if (!customer) {
            return res.status(404).type('text/plain').send('No customer with id ' + req.params.id);
        }
        res.json(data.clone(customer));
    });
});

app.post('/api/customers', function (req, res) {
    var body = req.body || {};
    sendLater(res, function () {
        if (!body.firstName || !body.lastName || !body.email) {
            return res.status(400).type('text/plain').send('firstName, lastName and email are required');
        }
        var duplicate = state.customers.some(function (c) {
            return c.email.toLowerCase() === String(body.email).toLowerCase();
        });
        if (duplicate) {
            return res.status(409).type('text/plain').send('Duplicate email ' + body.email);
        }
        var created = {
            id: nextId('customer'),
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            phone: body.phone || '',
            shippingAddress: body.shippingAddress || ''
        };
        state.customers.push(created);
        res.status(201).json(data.clone(created));
    });
});

app.put('/api/customers/:id', function (req, res) {
    var customer = findById(state.customers, req.params.id);
    var body = req.body || {};
    sendLater(res, function () {
        if (!customer) {
            return res.status(404).type('text/plain').send('No customer with id ' + req.params.id);
        }
        ['firstName', 'lastName', 'email', 'phone', 'shippingAddress'].forEach(function (key) {
            if (body[key] !== undefined) {
                customer[key] = body[key];
            }
        });
        res.json(data.clone(customer));
    });
});

app.delete('/api/customers/:id', function (req, res) {
    var idx = indexById(state.customers, req.params.id);
    sendLater(res, function () {
        if (idx === -1) {
            return res.status(404).type('text/plain').send('No customer with id ' + req.params.id);
        }
        var removed = state.customers.splice(idx, 1)[0];
        res.json({ deleted: removed.id });
    });
});

/* ----------------------------------------------------------------- orders */

var TERMINAL_STATUSES = ['CANCELLED', 'DELIVERED'];
var VALID_STATUSES = ['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

app.get('/api/orders', function (req, res) {
    sendLater(res, function () {
        var list = data.clone(state.orders);
        if (req.query.status) {
            list = list.filter(function (o) {
                return o.status === String(req.query.status).toUpperCase();
            });
        }
        res.json(list);
    });
});

app.get('/api/orders/:id', function (req, res) {
    var ord = findById(state.orders, req.params.id);
    sendLater(res, function () {
        if (!ord) {
            return res.status(404).type('text/plain').send('No order with id ' + req.params.id);
        }
        res.json(data.clone(ord));
    });
});

app.post('/api/orders', function (req, res) {
    var body = req.body || {};
    sendLater(res, function () {
        if (!body.customerId) {
            return res.status(400).type('text/plain').send('A customer must be selected');
        }
        var customer = findById(state.customers, body.customerId);
        if (!customer) {
            return res.status(400).type('text/plain').send('Unknown customer ' + body.customerId);
        }
        var lineItems = body.lineItems || [];
        if (!lineItems.length) {
            return res.status(400).type('text/plain').send('At least one line item is required');
        }

        var resolved = [];
        for (var i = 0; i < lineItems.length; i += 1) {
            var item = lineItems[i];
            var product = findById(state.products, item.productId);
            if (!product) {
                return res.status(400).type('text/plain').send('Unknown product ' + item.productId);
            }
            var quantity = parseInt(item.quantity, 10);
            if (!quantity || quantity < 1) {
                return res.status(400).type('text/plain').send('Quantity must be at least 1 for ' + product.sku);
            }
            if (quantity > product.quantityOnHand) {
                return res.status(409).type('text/plain')
                    .send('Insufficient stock for ' + product.sku + ' (on hand ' + product.quantityOnHand + ')');
            }
            resolved.push({ product: product, quantity: quantity });
        }

        var createdLineItems = resolved.map(function (entry) {
            entry.product.quantityOnHand -= entry.quantity;
            return {
                id: nextId('order'),
                productId: entry.product.id,
                sku: entry.product.sku,
                productName: entry.product.name,
                unitPrice: entry.product.unitPrice,
                quantity: entry.quantity
            };
        });

        var created = {
            id: nextId('order'),
            customer: data.clone(customer),
            orderDate: new Date().toISOString(),
            status: 'NEW',
            totalAmount: round2(createdLineItems.reduce(function (sum, li) {
                return sum + li.unitPrice * li.quantity;
            }, 0)),
            lineItems: createdLineItems
        };
        state.orders.unshift(created);
        state.notifications.unshift({
            id: nextId('notification'),
            sentDate: new Date().toISOString(),
            channel: 'EMAIL',
            recipient: customer.email,
            subject: 'Order ' + created.id + ' received',
            successful: true
        });
        res.status(201).json(data.clone(created));
    });
});

app.put('/api/orders/:id/status', function (req, res) {
    var ord = findById(state.orders, req.params.id);
    var value = req.query.value ? String(req.query.value).toUpperCase() : null;
    sendLater(res, function () {
        if (!ord) {
            return res.status(404).type('text/plain').send('No order with id ' + req.params.id);
        }
        if (!value || VALID_STATUSES.indexOf(value) === -1) {
            return res.status(400).type('text/plain').send('Invalid status value: ' + req.query.value);
        }
        if (TERMINAL_STATUSES.indexOf(ord.status) !== -1) {
            return res.status(409).type('text/plain')
                .send('Order ' + ord.id + ' is ' + ord.status + ' and cannot change status');
        }
        ord.status = value;
        res.json(data.clone(ord));
    });
});

app.put('/api/orders/:id/cancel', function (req, res) {
    var ord = findById(state.orders, req.params.id);
    sendLater(res, function () {
        if (!ord) {
            return res.status(404).type('text/plain').send('No order with id ' + req.params.id);
        }
        if (ord.status === 'DELIVERED') {
            return res.status(409).type('text/plain').send('Delivered orders cannot be cancelled');
        }
        if (ord.status === 'CANCELLED') {
            return res.status(409).type('text/plain').send('Order ' + ord.id + ' is already cancelled');
        }
        ord.status = 'CANCELLED';
        // Restock
        (ord.lineItems || []).forEach(function (li) {
            var product = findById(state.products, li.productId);
            if (product) {
                product.quantityOnHand += li.quantity;
            }
        });
        res.json(data.clone(ord));
    });
});

/* --------------------------------------------------------------- invoices */

app.get('/api/invoices', function (req, res) {
    sendLater(res, function () {
        res.json(data.clone(state.invoices));
    });
});

app.post('/api/invoices/generate/:orderId', function (req, res) {
    var ord = findById(state.orders, req.params.orderId);
    sendLater(res, function () {
        if (!ord) {
            return res.status(404).type('text/plain').send('No order with id ' + req.params.orderId);
        }
        if (ord.status === 'CANCELLED') {
            return res.status(409).type('text/plain')
                .send('Cannot invoice cancelled order ' + ord.id);
        }
        var existing = state.invoices.filter(function (inv) {
            return inv.order && inv.order.id === ord.id;
        })[0];
        if (existing) {
            return res.status(409).type('text/plain')
                .send('Invoice ' + existing.invoiceNumber + ' already exists for order ' + ord.id);
        }
        var created = data.invoiceFor(nextId('invoice'), ord, 'PENDING', 0);
        created.issueDate = new Date().toISOString();
        state.invoices.unshift(created);
        res.status(201).json(data.clone(created));
    });
});

app.put('/api/invoices/:id/mark-paid', function (req, res) {
    var invoice = findById(state.invoices, req.params.id);
    sendLater(res, function () {
        if (!invoice) {
            return res.status(404).type('text/plain').send('No invoice with id ' + req.params.id);
        }
        if (invoice.paymentStatus === 'PAID') {
            return res.status(409).type('text/plain').send('Invoice already paid');
        }
        invoice.paymentStatus = 'PAID';
        invoice.paidDate = new Date().toISOString();
        res.json(data.clone(invoice));
    });
});

/* ---------------------------------------------------------- notifications */

app.get('/api/notifications', function (req, res) {
    sendLater(res, function () {
        res.json(data.clone(state.notifications));
    });
});

app.post('/api/notifications/test', function (req, res) {
    sendLater(res, function () {
        var created = {
            id: nextId('notification'),
            sentDate: new Date().toISOString(),
            channel: 'EMAIL',
            recipient: 'test@example.com',
            subject: 'Test notification',
            // Alternate success/failure so both label branches in the template render.
            successful: state.notifications.length % 2 === 0
        };
        state.notifications.unshift(created);
        res.status(201).json(data.clone(created));
    });
});

/* ---------------------------------------------------------------- reports */

app.get('/api/reports/sales-summary', function (req, res) {
    sendLater(res, function () {
        var billable = state.orders.filter(function (o) {
            return o.status !== 'CANCELLED';
        });
        var revenue = round2(billable.reduce(function (sum, o) {
            return sum + o.totalAmount;
        }, 0));
        res.json({
            totalOrders: state.orders.length,
            totalRevenue: revenue,
            averageOrderValue: billable.length ? round2(revenue / billable.length) : 0,
            pendingInvoices: state.invoices.filter(function (inv) {
                return inv.paymentStatus === 'PENDING';
            }).length
        });
    });
});

app.get('/api/reports/low-stock-alerts', function (req, res) {
    sendLater(res, function () {
        res.json(state.products.filter(function (p) {
            return p.quantityOnHand <= p.reorderThreshold;
        }).map(function (p) {
            return {
                productId: p.id,
                sku: p.sku,
                productName: p.name,
                quantityOnHand: p.quantityOnHand,
                reorderThreshold: p.reorderThreshold
            };
        }));
    });
});

app.post('/api/reports/low-stock-alerts/dispatch', function (req, res) {
    sendLater(res, function () {
        var alerts = state.products.filter(function (p) {
            return p.quantityOnHand <= p.reorderThreshold;
        });
        alerts.forEach(function (p) {
            state.notifications.unshift({
                id: nextId('notification'),
                sentDate: new Date().toISOString(),
                channel: 'EMAIL',
                recipient: 'ops@example.com',
                subject: 'Low stock: ' + p.sku,
                successful: true
            });
        });
        res.json({ dispatched: alerts.length });
    });
});

/* ------------------------------------------------------- unknown api route */

app.use('/api', function (req, res) {
    res.status(404).type('text/plain').send('Unknown API endpoint: ' + req.method + ' /api' + req.path);
});

/* ----------------------------------------------- static AngularJS app host */

if (SERVE_STATIC) {
    app.use(instrument.instrumentAppJs(REPO_ROOT, { enabled: COVERAGE }));
    app.use(express.static(REPO_ROOT, { index: 'index.html', etag: false }));
    // Hashbang routing means every deep link is still index.html.
    app.get('*', function (req, res) {
        res.sendFile(path.join(REPO_ROOT, 'index.html'));
    });
}

if (require.main === module) {
    var server = app.listen(PORT, function () {
        /* eslint-disable no-console */
        console.log('[mock-backend] listening on http://localhost:' + PORT);
        console.log('[mock-backend] static app: ' + (SERVE_STATIC ? 'on' : 'off') +
            ', instrumentation: ' + (COVERAGE ? 'on' : 'off'));
    });
    process.on('SIGTERM', function () {
        server.close(function () {
            process.exit(0);
        });
    });
}

module.exports = app;
