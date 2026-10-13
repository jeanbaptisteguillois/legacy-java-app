package com.example.inventory.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.entity.Customer;

public class CustomerServiceTest {

    private EntityManager em;
    private CustomerService customerService;

    @Before
    public void setUp() throws Exception {
        em = mock(EntityManager.class);
        customerService = new CustomerService();
        setField(customerService, "em", em);
    }

    @Test
    public void createCustomer_persistsCustomer() {
        Customer customer = new Customer();
        customer.setFirstName("Alice");
        customer.setLastName("Nguyen");
        customer.setEmail("alice@example.com");

        Customer result = customerService.createCustomer(customer);

        verify(em).persist(customer);
        assertEquals("alice@example.com", result.getEmail());
    }

    @Test(expected = IllegalArgumentException.class)
    public void createCustomer_withBlankEmail_throws() {
        Customer customer = new Customer();
        customer.setFirstName("Alice");
        customer.setLastName("Nguyen");
        customer.setEmail("");
        customerService.createCustomer(customer);
    }

    @Test(expected = IllegalArgumentException.class)
    public void createCustomer_withMissingLastName_throws() {
        Customer customer = new Customer();
        customer.setFirstName("Alice");
        customer.setEmail("alice@example.com");
        customerService.createCustomer(customer);
    }

    @Test
    public void deleteCustomer_whenNotFound_doesNothing() {
        when(em.find(Customer.class, 99L)).thenReturn(null);

        customerService.deleteCustomer(99L);

        verify(em, never()).remove(any());
    }

    @SuppressWarnings("unchecked")
    @Test
    public void findByEmail_whenNoResult_returnsNull() {
        TypedQuery<Customer> query = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Customer.findByEmail"), eq(Customer.class))).thenReturn(query);
        when(query.setParameter(eq("email"), any())).thenReturn(query);
        when(query.getSingleResult()).thenThrow(new NoResultException());

        assertNull(customerService.findByEmail("missing@example.com"));
    }

    @SuppressWarnings("unchecked")
    @Test
    public void findAll_returnsAllCustomers() {
        TypedQuery<Customer> query = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Customer.findAll"), eq(Customer.class))).thenReturn(query);
        when(query.getResultList()).thenReturn(Arrays.asList(new Customer(), new Customer(), new Customer()));

        assertEquals(3, customerService.findAll().size());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
