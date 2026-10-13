package com.example.inventory.service;

import java.util.List;

import jakarta.ejb.Local;

import com.example.inventory.entity.Customer;

/**
 * Local business interface for customer management.
 */
@Local
public interface CustomerServiceLocal {

    Customer createCustomer(Customer customer);

    Customer updateCustomer(Long id, Customer customer);

    void deleteCustomer(Long id);

    Customer findById(Long id);

    Customer findByEmail(String email);

    List<Customer> findAll();
}
