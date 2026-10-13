package com.example.inventory.rest;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.inventory.dto.OrderRequestDto;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.OrderStatus;
import com.example.inventory.service.OrderServiceLocal;

/**
 * REST endpoints for order placement and lifecycle management, consumed
 * by the AngularJS frontend's Order module.
 *
 * <p>Migrated from JAX-RS. The {@code @ApplicationPath("/api")} of the former
 * {@code InventoryRestApplication} is preserved as the {@code /api} prefix of
 * this mapping.</p>
 */
@RestController
@RequestMapping(value = "/api/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderResource {

    private final OrderServiceLocal orderService;

    public OrderResource(OrderServiceLocal orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<Order> listOrders(@RequestParam(value = "customerId", required = false) Long customerId,
                                   @RequestParam(value = "status", required = false) OrderStatus status) {
        if (customerId != null) {
            return orderService.findByCustomer(customerId);
        }
        if (status != null) {
            return orderService.findByStatus(status);
        }
        return orderService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable("id") Long id) {
        Order order = orderService.findById(id);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequestDto request) {
        try {
            Order order = orderService.placeOrder(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable("id") Long id,
                                               @RequestParam(value = "value", required = false) OrderStatus newStatus) {
        Order updated = orderService.updateStatus(id, newStatus);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable("id") Long id) {
        orderService.cancelOrder(id);
        return ResponseEntity.noContent().build();
    }
}
