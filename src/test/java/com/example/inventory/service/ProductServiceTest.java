package com.example.inventory.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.entity.Product;

public class ProductServiceTest {

    private EntityManager em;
    private ProductService productService;

    @Before
    public void setUp() throws Exception {
        em = mock(EntityManager.class);
        productService = new ProductService();
        setField(productService, "em", em);
    }

    @Test
    public void createProduct_persistsAndReturnsProduct() {
        Product product = new Product();
        product.setSku("SKU-1");
        product.setName("Test Product");

        Product result = productService.createProduct(product);

        verify(em).persist(product);
        assertEquals("SKU-1", result.getSku());
    }

    @Test(expected = IllegalArgumentException.class)
    public void createProduct_withBlankSku_throws() {
        Product product = new Product();
        product.setSku("");
        productService.createProduct(product);
    }

    @Test
    public void findById_delegatesToEntityManager() {
        Product product = new Product();
        product.setId(42L);
        when(em.find(Product.class, 42L)).thenReturn(product);

        Product result = productService.findById(42L);

        assertEquals(Long.valueOf(42L), result.getId());
    }

    @SuppressWarnings("unchecked")
    @Test
    public void findBySku_whenNoResult_returnsNull() {
        TypedQuery<Product> query = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Product.findBySku"), eq(Product.class))).thenReturn(query);
        when(query.setParameter(eq("sku"), any())).thenReturn(query);
        when(query.getSingleResult()).thenThrow(new NoResultException());

        Product result = productService.findBySku("UNKNOWN-SKU");

        assertNull(result);
    }

    @SuppressWarnings("unchecked")
    @Test
    public void findAll_returnsResultsFromNamedQuery() {
        Product p1 = new Product();
        Product p2 = new Product();
        TypedQuery<Product> query = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Product.findAll"), eq(Product.class))).thenReturn(query);
        when(query.getResultList()).thenReturn(Arrays.asList(p1, p2));

        assertEquals(2, productService.findAll().size());
    }

    @Test
    public void adjustStock_increasesQuantity() {
        Product product = new Product();
        product.setId(1L);
        product.setQuantityOnHand(10);
        product.setReorderThreshold(5);
        when(em.find(Product.class, 1L)).thenReturn(product);

        productService.adjustStock(1L, 5);

        assertEquals(15, product.getQuantityOnHand());
        assertFalse(product.isLowStock());
    }

    @Test(expected = IllegalStateException.class)
    public void adjustStock_belowZero_throws() {
        Product product = new Product();
        product.setId(1L);
        product.setQuantityOnHand(2);
        when(em.find(Product.class, 1L)).thenReturn(product);

        productService.adjustStock(1L, -5);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
