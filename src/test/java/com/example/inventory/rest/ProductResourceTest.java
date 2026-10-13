package com.example.inventory.rest;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;

import jakarta.ws.rs.core.Response;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.entity.Product;
import com.example.inventory.service.ProductServiceLocal;

public class ProductResourceTest {

    private ProductServiceLocal productService;
    private ProductResource resource;

    @Before
    public void setUp() throws Exception {
        productService = mock(ProductServiceLocal.class);
        resource = new ProductResource();
        setField(resource, "productService", productService);
    }

    @Test
    public void listProducts_returnsAllFromService() {
        when(productService.findAll()).thenReturn(Arrays.asList(new Product(), new Product()));

        assertEquals(2, resource.listProducts().size());
    }

    @Test
    public void getProduct_whenFound_returnsOk() {
        Product product = new Product();
        product.setId(1L);
        when(productService.findById(1L)).thenReturn(product);

        Response response = resource.getProduct(1L);

        assertEquals(200, response.getStatus());
        assertEquals(product, response.getEntity());
    }

    @Test
    public void getProduct_whenMissing_returnsNotFound() {
        when(productService.findById(404L)).thenReturn(null);

        Response response = resource.getProduct(404L);

        assertEquals(404, response.getStatus());
    }

    @Test
    public void createProduct_returnsCreatedStatus() {
        Product input = new Product();
        input.setSku("SKU-1");
        when(productService.createProduct(input)).thenReturn(input);

        Response response = resource.createProduct(input);

        assertEquals(201, response.getStatus());
        verify(productService).createProduct(input);
    }

    @Test
    public void deleteProduct_returnsNoContent() {
        Response response = resource.deleteProduct(1L);

        assertEquals(204, response.getStatus());
        verify(productService).deleteProduct(1L);
    }

    @Test
    public void listLowStock_delegatesToService() {
        Product product = new Product();
        when(productService.findLowStock()).thenReturn(Collections.singletonList(product));

        assertEquals(1, resource.listLowStock().size());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
