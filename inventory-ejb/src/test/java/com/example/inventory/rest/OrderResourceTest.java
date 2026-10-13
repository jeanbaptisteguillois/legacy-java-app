package com.example.inventory.rest;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;

import jakarta.ws.rs.core.Response;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.dto.OrderRequestDto;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.OrderStatus;
import com.example.inventory.service.OrderServiceLocal;

public class OrderResourceTest {

    private OrderServiceLocal orderService;
    private OrderResource resource;

    @Before
    public void setUp() throws Exception {
        orderService = mock(OrderServiceLocal.class);
        resource = new OrderResource();
        setField(resource, "orderService", orderService);
    }

    @Test
    public void listOrders_withNoFilters_returnsAll() {
        when(orderService.findAll()).thenReturn(Arrays.asList(new Order(), new Order()));

        assertEquals(2, resource.listOrders(null, null).size());
    }

    @Test
    public void listOrders_filteredByCustomer_delegatesToService() {
        when(orderService.findByCustomer(1L)).thenReturn(Collections.singletonList(new Order()));

        assertEquals(1, resource.listOrders(1L, null).size());
    }

    @Test
    public void listOrders_filteredByStatus_delegatesToService() {
        when(orderService.findByStatus(OrderStatus.SHIPPED)).thenReturn(Collections.singletonList(new Order()));

        assertEquals(1, resource.listOrders(null, OrderStatus.SHIPPED).size());
    }

    @Test
    public void placeOrder_onSuccess_returnsCreated() {
        OrderRequestDto request = new OrderRequestDto();
        Order order = new Order();
        when(orderService.placeOrder(request)).thenReturn(order);

        Response response = resource.placeOrder(request);

        assertEquals(201, response.getStatus());
    }

    @Test
    public void placeOrder_onInvalidRequest_returnsBadRequest() {
        OrderRequestDto request = new OrderRequestDto();
        when(orderService.placeOrder(request)).thenThrow(new IllegalArgumentException("No customer"));

        Response response = resource.placeOrder(request);

        assertEquals(400, response.getStatus());
    }

    @Test
    public void cancelOrder_returnsNoContent() {
        Response response = resource.cancelOrder(5L);

        assertEquals(204, response.getStatus());
        verify(orderService).cancelOrder(5L);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
