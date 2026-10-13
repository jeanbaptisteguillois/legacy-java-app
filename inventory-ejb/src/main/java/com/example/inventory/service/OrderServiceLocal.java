package com.example.inventory.service;

import java.util.List;

import jakarta.ejb.Local;

import com.example.inventory.dto.OrderRequestDto;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.OrderStatus;

/**
 * Local business interface for order management.
 */
@Local
public interface OrderServiceLocal {

    Order placeOrder(OrderRequestDto request);

    Order updateStatus(Long orderId, OrderStatus newStatus);

    void cancelOrder(Long orderId);

    Order findById(Long orderId);

    List<Order> findAll();

    List<Order> findByCustomer(Long customerId);

    List<Order> findByStatus(OrderStatus status);
}
