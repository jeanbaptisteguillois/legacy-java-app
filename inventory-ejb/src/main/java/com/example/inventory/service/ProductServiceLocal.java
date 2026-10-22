package com.example.inventory.service;

import java.util.List;

import javax.ejb.Local;

import com.example.inventory.entity.Product;

/**
 * Local business interface for product/inventory management.
 */
@Local
public interface ProductServiceLocal {

    Product createProduct(Product product);

    Product updateProduct(Long id, Product product);

    void deleteProduct(Long id);

    Product findById(Long id);

    Product findBySku(String sku);

    List<Product> findAll();

    List<Product> findLowStock();

    void adjustStock(Long productId, int delta);
}
