package com.example.inventory.entity;

/**
 * Lifecycle states for a customer {@link Order}.
 */
public enum OrderStatus {
    NEW,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
