package com.example.inventory.service;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;

import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.inventory.entity.Product;
import com.example.inventory.util.LoggingUtil;

/**
 * Spring service implementing product/inventory management. Migrated from a
 * {@code @Stateless} EJB; the container-managed REQUIRED transaction
 * demarcation is now expressed with {@code @Transactional}.
 */
@Service
@Transactional
public class ProductService implements ProductServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(ProductService.class);

    @PersistenceContext
    private EntityManager em;

    @Override
    public Product createProduct(Product product) {
        Validate.notNull(product, "product must not be null");
        Validate.notEmpty(product.getSku(), "sku must not be empty");
        LOG.info("Creating product with SKU " + product.getSku());
        em.persist(product);
        return product;
    }

    @Override
    public Product updateProduct(Long id, Product updated) {
        Product existing = findById(id);
        if (existing == null) {
            LOG.warn("Attempted to update non-existent product id=" + id);
            return null;
        }
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setUnitPrice(updated.getUnitPrice());
        existing.setQuantityOnHand(updated.getQuantityOnHand());
        existing.setReorderThreshold(updated.getReorderThreshold());
        return em.merge(existing);
    }

    @Override
    public void deleteProduct(Long id) {
        Product existing = findById(id);
        if (existing != null) {
            LOG.info("Deleting product id=" + id);
            em.remove(existing);
        }
    }

    @Override
    public Product findById(Long id) {
        return em.find(Product.class, id);
    }

    @Override
    public Product findBySku(String sku) {
        try {
            return em.createNamedQuery("Product.findBySku", Product.class)
                    .setParameter("sku", sku)
                    .getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    @Override
    public List<Product> findAll() {
        return em.createNamedQuery("Product.findAll", Product.class).getResultList();
    }

    @Override
    public List<Product> findLowStock() {
        return em.createNamedQuery("Product.findLowStock", Product.class).getResultList();
    }

    @Override
    public void adjustStock(Long productId, int delta) {
        Product product = findById(productId);
        if (product == null) {
            throw new IllegalArgumentException("No product with id " + productId);
        }
        int newQuantity = product.getQuantityOnHand() + delta;
        if (newQuantity < 0) {
            throw new IllegalStateException("Insufficient stock for product " + product.getSku());
        }
        product.setQuantityOnHand(newQuantity);
        if (product.isLowStock()) {
            LOG.warn("Product " + product.getSku() + " is now at or below reorder threshold");
        }
    }
}
