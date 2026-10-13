package com.example.inventory.rest;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import jakarta.ws.rs.core.Response;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.entity.Customer;
import com.example.inventory.service.CustomerServiceLocal;

public class CustomerResourceTest {

    private CustomerServiceLocal customerService;
    private CustomerResource resource;

    @Before
    public void setUp() throws Exception {
        customerService = mock(CustomerServiceLocal.class);
        resource = new CustomerResource();
        setField(resource, "customerService", customerService);
    }

    @Test
    public void listCustomers_returnsAllFromService() {
        when(customerService.findAll()).thenReturn(Arrays.asList(new Customer(), new Customer()));

        assertEquals(2, resource.listCustomers().size());
    }

    @Test
    public void getCustomer_whenFound_returnsOk() {
        Customer customer = new Customer();
        customer.setId(1L);
        when(customerService.findById(1L)).thenReturn(customer);

        Response response = resource.getCustomer(1L);

        assertEquals(200, response.getStatus());
    }

    @Test
    public void getCustomer_whenMissing_returnsNotFound() {
        when(customerService.findById(404L)).thenReturn(null);

        Response response = resource.getCustomer(404L);

        assertEquals(404, response.getStatus());
    }

    @Test
    public void createCustomer_returnsCreatedStatus() {
        Customer input = new Customer();
        input.setEmail("alice@example.com");
        when(customerService.createCustomer(input)).thenReturn(input);

        Response response = resource.createCustomer(input);

        assertEquals(201, response.getStatus());
    }

    @Test
    public void updateCustomer_whenMissing_returnsNotFound() {
        Customer input = new Customer();
        when(customerService.updateCustomer(404L, input)).thenReturn(null);

        Response response = resource.updateCustomer(404L, input);

        assertEquals(404, response.getStatus());
    }

    @Test
    public void deleteCustomer_returnsNoContent() {
        Response response = resource.deleteCustomer(1L);

        assertEquals(204, response.getStatus());
        verify(customerService).deleteCustomer(1L);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
