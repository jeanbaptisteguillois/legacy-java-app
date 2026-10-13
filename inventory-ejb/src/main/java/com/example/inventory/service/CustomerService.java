package com.example.inventory.service;

import java.util.List;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;

import org.apache.commons.lang.Validate;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;

import com.example.inventory.entity.Customer;
import com.example.inventory.util.LoggingUtil;

/**
 * Stateless session bean implementing customer management.
 */
@Stateless
public class CustomerService implements CustomerServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(CustomerService.class);

    @PersistenceContext(unitName = "inventoryPU")
    private EntityManager em;

    @Override
    public Customer createCustomer(Customer customer) {
        Validate.notNull(customer, "customer must not be null");
        Validate.notEmpty(customer.getEmail(), "email must not be empty");
        if (StringUtils.isBlank(customer.getFirstName()) || StringUtils.isBlank(customer.getLastName())) {
            throw new IllegalArgumentException("First and last name are required");
        }
        LOG.info("Creating customer with email " + customer.getEmail());
        em.persist(customer);
        return customer;
    }

    @Override
    public Customer updateCustomer(Long id, Customer updated) {
        Customer existing = findById(id);
        if (existing == null) {
            return null;
        }
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setPhone(updated.getPhone());
        existing.setShippingAddress(updated.getShippingAddress());
        return em.merge(existing);
    }

    @Override
    public void deleteCustomer(Long id) {
        Customer existing = findById(id);
        if (existing != null) {
            em.remove(existing);
        }
    }

    @Override
    public Customer findById(Long id) {
        return em.find(Customer.class, id);
    }

    @Override
    public Customer findByEmail(String email) {
        try {
            return em.createNamedQuery("Customer.findByEmail", Customer.class)
                    .setParameter("email", email)
                    .getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    @Override
    public List<Customer> findAll() {
        return em.createNamedQuery("Customer.findAll", Customer.class).getResultList();
    }
}
