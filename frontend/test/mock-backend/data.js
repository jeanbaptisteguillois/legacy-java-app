/**
 * Seed data + in-memory state for the mock backend.
 *
 * The dataset is deliberately shaped to exercise BOTH sides of every
 * conditional in the AngularJS app:
 *   - products: some with lowStock true, some false
 *   - orders: one order per status (NEW, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
 *     so that the ng-if guards on "Mark Shipped" / "Cancel" are hit both ways
 *   - invoices: PENDING (shows "Mark Paid") and PAID (hides it)
 *   - notifications: successful true and false (both label branches)
 *   - 'empty' dataset: every collection empty, for empty-state branches
 */
'use strict';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

var DEFAULT_PRODUCTS = [
    {
        id: 1,
        sku: 'SKU-1001',
        name: 'Widget Standard',
        description: 'Standard duty widget',
        unitPrice: 19.99,
        quantityOnHand: 120,
        reorderThreshold: 25
    },
    {
        id: 2,
        sku: 'SKU-1002',
        name: 'Widget Heavy Duty',
        description: 'Heavy duty widget for industrial use',
        unitPrice: 149.5,
        quantityOnHand: 4,
        reorderThreshold: 20
    },
    {
        id: 3,
        sku: 'SKU-1003',
        name: 'Gadget Mini',
        description: '',
        unitPrice: 7.25,
        quantityOnHand: 0,
        reorderThreshold: 10
    },
    {
        id: 4,
        sku: 'SKU-1004',
        name: 'Gadget Pro',
        description: 'Professional gadget',
        unitPrice: 89,
        quantityOnHand: 58,
        reorderThreshold: 15
    }
];

var DEFAULT_CUSTOMERS = [
    {
        id: 1,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+44 20 7946 0001',
        shippingAddress: '12 Analytical Way, London'
    },
    {
        id: 2,
        firstName: 'Alan',
        lastName: 'Turing',
        email: 'alan@example.com',
        phone: '',
        shippingAddress: '1 Bletchley Park, Milton Keynes'
    },
    {
        id: 3,
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        phone: '+1 202 555 0133',
        shippingAddress: ''
    }
];

function order(id, customer, status, dayOffset, lineItems) {
    var total = lineItems.reduce(function (sum, li) {
        return sum + li.unitPrice * li.quantity;
    }, 0);
    return {
        id: id,
        customer: clone(customer),
        orderDate: new Date(Date.UTC(2024, 0, 10 + dayOffset, 9, 30)).toISOString(),
        status: status,
        totalAmount: Math.round(total * 100) / 100,
        lineItems: lineItems
    };
}

function buildDefaultOrders(customers, products) {
    function li(product, quantity) {
        return {
            id: product.id * 100 + quantity,
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            unitPrice: product.unitPrice,
            quantity: quantity
        };
    }

    return [
        order(1001, customers[0], 'NEW', 0, [li(products[0], 3), li(products[3], 1)]),
        order(1002, customers[1], 'CONFIRMED', 1, [li(products[1], 2)]),
        order(1003, customers[2], 'SHIPPED', 2, [li(products[0], 10)]),
        order(1004, customers[0], 'DELIVERED', 3, [li(products[3], 4)]),
        order(1005, customers[1], 'CANCELLED', 4, [li(products[2], 5)])
    ];
}

function invoiceFor(id, ord, paymentStatus, dayOffset) {
    var subtotal = ord.totalAmount;
    var tax = Math.round(subtotal * 0.2 * 100) / 100;
    return {
        id: id,
        invoiceNumber: 'INV-' + String(id).padStart(5, '0'),
        order: { id: ord.id, status: ord.status, totalAmount: ord.totalAmount },
        issueDate: new Date(Date.UTC(2024, 0, 15 + dayOffset, 12, 0)).toISOString(),
        subtotal: subtotal,
        taxAmount: tax,
        totalAmount: Math.round((subtotal + tax) * 100) / 100,
        paymentStatus: paymentStatus
    };
}

var DEFAULT_NOTIFICATIONS = [
    {
        id: 1,
        sentDate: new Date(Date.UTC(2024, 0, 16, 8, 5)).toISOString(),
        channel: 'EMAIL',
        recipient: 'ada@example.com',
        subject: 'Order 1001 received',
        successful: true
    },
    {
        id: 2,
        sentDate: new Date(Date.UTC(2024, 0, 16, 8, 6)).toISOString(),
        channel: 'SMS',
        recipient: '+44 20 7946 0001',
        subject: 'Order 1001 dispatched',
        successful: false
    },
    {
        id: 3,
        sentDate: new Date(Date.UTC(2024, 0, 17, 9, 15)).toISOString(),
        channel: 'EMAIL',
        recipient: 'ops@example.com',
        subject: 'Low stock alert digest',
        successful: true
    }
];

/** Builds a brand-new mutable state object for the requested dataset. */
function createState(dataset) {
    if (dataset === 'empty') {
        return {
            dataset: 'empty',
            products: [],
            customers: [],
            orders: [],
            invoices: [],
            notifications: [],
            sequences: { product: 100, customer: 100, order: 2000, invoice: 500, notification: 100 }
        };
    }

    var products = clone(DEFAULT_PRODUCTS);
    var customers = clone(DEFAULT_CUSTOMERS);
    var orders = buildDefaultOrders(customers, products);

    return {
        dataset: 'default',
        products: products,
        customers: customers,
        orders: orders,
        invoices: [
            invoiceFor(501, orders[3], 'PAID', 0),
            invoiceFor(502, orders[2], 'PENDING', 1)
        ],
        notifications: clone(DEFAULT_NOTIFICATIONS),
        sequences: { product: 100, customer: 100, order: 2000, invoice: 502, notification: 100 }
    };
}

module.exports = {
    createState: createState,
    invoiceFor: invoiceFor,
    clone: clone
};
