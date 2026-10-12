package com.example.inventory.entity;

/**
 * Payment lifecycle states for an {@link Invoice}.
 */
public enum InvoicePaymentStatus {
    PENDING,
    PAID,
    OVERDUE,
    VOID
}
