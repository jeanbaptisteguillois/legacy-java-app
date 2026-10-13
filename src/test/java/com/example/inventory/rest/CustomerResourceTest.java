package com.example.inventory.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import org.springframework.http.ResponseEntity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.inventory.entity.Customer;
import com.example.inventory.service.CustomerServiceLocal;

public class CustomerResourceTest {

    private CustomerServiceLocal customerService;
    private CustomerResource resource;

    @BeforeEach
    public void setUp() {
        customerService = mock(CustomerServiceLocal.class);
        resource = new CustomerResource(customerService);
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

        ResponseEntity<?> response = resource.getCustomer(1L);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void getCustomer_whenMissing_returnsNotFound() {
        when(customerService.findById(404L)).thenReturn(null);

        ResponseEntity<?> response = resource.getCustomer(404L);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    public void createCustomer_returnsCreatedStatus() {
        Customer input = new Customer();
        input.setEmail("alice@example.com");
        when(customerService.createCustomer(input)).thenReturn(input);

        ResponseEntity<?> response = resource.createCustomer(input);

        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    public void updateCustomer_whenMissing_returnsNotFound() {
        Customer input = new Customer();
        when(customerService.updateCustomer(404L, input)).thenReturn(null);

        ResponseEntity<?> response = resource.updateCustomer(404L, input);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    public void deleteCustomer_returnsNoContent() {
        ResponseEntity<?> response = resource.deleteCustomer(1L);

        assertEquals(204, response.getStatusCode().value());
        verify(customerService).deleteCustomer(1L);
    }
}
