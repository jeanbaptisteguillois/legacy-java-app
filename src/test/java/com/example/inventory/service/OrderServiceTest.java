package com.example.inventory.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.dto.OrderRequestDto;
import com.example.inventory.dto.OrderRequestDto.OrderLineItemRequestDto;
import com.example.inventory.entity.Customer;
import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.OrderLineItem;
import com.example.inventory.entity.OrderStatus;
import com.example.inventory.entity.Product;

public class OrderServiceTest {

    private EntityManager em;
    private ProductServiceLocal productService;
    private CustomerServiceLocal customerService;
    private NotificationServiceLocal notificationService;
    private OrderService orderService;

    @Before
    public void setUp() throws Exception {
        em = mock(EntityManager.class);
        productService = mock(ProductServiceLocal.class);
        customerService = mock(CustomerServiceLocal.class);
        notificationService = mock(NotificationServiceLocal.class);

        orderService = new OrderService();
        setField(orderService, "em", em);
        setField(orderService, "productService", productService);
        setField(orderService, "customerService", customerService);
        setField(orderService, "notificationService", notificationService);
    }

    @Test
    public void placeOrder_persistsOrderAndSendsConfirmation() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setEmail("alice@example.com");
        when(customerService.findById(1L)).thenReturn(customer);

        Product product = new Product();
        product.setId(10L);
        product.setUnitPrice(new BigDecimal("19.99"));
        when(productService.findById(10L)).thenReturn(product);

        OrderRequestDto request = buildRequest(1L, 10L, 2);

        Order order = orderService.placeOrder(request);

        assertEquals(OrderStatus.NEW, order.getStatus());
        assertEquals(new BigDecimal("39.98"), order.getTotalAmount());
        verify(em).persist(order);
        verify(productService).adjustStock(10L, -2);
        verify(notificationService).send(eq(NotificationChannel.EMAIL), eq("alice@example.com"), any(), any());
    }

    @Test(expected = IllegalArgumentException.class)
    public void placeOrder_withUnknownCustomer_throws() {
        when(customerService.findById(99L)).thenReturn(null);
        orderService.placeOrder(buildRequest(99L, 10L, 1));
    }

    @Test(expected = IllegalArgumentException.class)
    public void placeOrder_withNoLineItems_throws() {
        OrderRequestDto request = new OrderRequestDto();
        request.setCustomerId(1L);
        request.setLineItems(new ArrayList<>());
        orderService.placeOrder(request);
    }

    @Test
    public void updateStatus_toShipped_sendsNotification() {
        Order order = new Order();
        order.setId(5L);
        Customer customer = new Customer();
        customer.setEmail("bob@example.com");
        order.setCustomer(customer);
        when(em.find(Order.class, 5L)).thenReturn(order);

        Order result = orderService.updateStatus(5L, OrderStatus.SHIPPED);

        assertEquals(OrderStatus.SHIPPED, result.getStatus());
        verify(notificationService).send(eq(NotificationChannel.EMAIL), eq("bob@example.com"), any(), any());
    }

    @Test
    public void updateStatus_whenOrderMissing_returnsNull() {
        when(em.find(Order.class, 404L)).thenReturn(null);

        assertNull(orderService.updateStatus(404L, OrderStatus.CONFIRMED));
    }

    @Test
    public void cancelOrder_restocksLineItems() {
        Order order = new Order();
        order.setId(7L);
        order.setStatus(OrderStatus.NEW);

        Product product = new Product();
        product.setId(20L);
        OrderLineItem lineItem = new OrderLineItem();
        lineItem.setProduct(product);
        lineItem.setQuantity(3);
        order.setLineItems(Collections.singletonList(lineItem));

        when(em.find(Order.class, 7L)).thenReturn(order);

        orderService.cancelOrder(7L);

        verify(productService).adjustStock(20L, 3);
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    private static OrderRequestDto buildRequest(Long customerId, Long productId, int quantity) {
        OrderRequestDto request = new OrderRequestDto();
        request.setCustomerId(customerId);
        OrderLineItemRequestDto item = new OrderLineItemRequestDto();
        item.setProductId(productId);
        item.setQuantity(quantity);
        request.setLineItems(Collections.singletonList(item));
        return request;
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
