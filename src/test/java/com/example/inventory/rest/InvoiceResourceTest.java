package com.example.inventory.rest;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;

import jakarta.ws.rs.core.Response;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.service.InvoiceServiceLocal;

public class InvoiceResourceTest {

    private InvoiceServiceLocal invoiceService;
    private InvoiceResource resource;

    @Before
    public void setUp() throws Exception {
        invoiceService = mock(InvoiceServiceLocal.class);
        resource = new InvoiceResource();
        setField(resource, "invoiceService", invoiceService);
    }

    @Test
    public void listInvoices_withNoFilter_returnsAll() {
        when(invoiceService.findAll()).thenReturn(Arrays.asList(new Invoice(), new Invoice()));

        assertEquals(2, resource.listInvoices(null).size());
    }

    @Test
    public void listInvoices_filteredByStatus_delegatesToService() {
        when(invoiceService.findByPaymentStatus(InvoicePaymentStatus.PENDING))
                .thenReturn(Collections.singletonList(new Invoice()));

        assertEquals(1, resource.listInvoices(InvoicePaymentStatus.PENDING).size());
    }

    @Test
    public void getInvoice_whenMissing_returnsNotFound() {
        when(invoiceService.findById(404L)).thenReturn(null);

        Response response = resource.getInvoice(404L);

        assertEquals(404, response.getStatus());
    }

    @Test
    public void generateInvoice_onSuccess_returnsCreated() {
        Invoice invoice = new Invoice();
        when(invoiceService.generateInvoice(1L)).thenReturn(invoice);

        Response response = resource.generateInvoice(1L);

        assertEquals(201, response.getStatus());
    }

    @Test
    public void generateInvoice_onInvalidOrder_returnsBadRequest() {
        when(invoiceService.generateInvoice(404L)).thenThrow(new IllegalArgumentException("No order"));

        Response response = resource.generateInvoice(404L);

        assertEquals(400, response.getStatus());
    }

    @Test
    public void markPaid_whenMissing_returnsNotFound() {
        when(invoiceService.markPaid(404L)).thenReturn(null);

        Response response = resource.markPaid(404L);

        assertEquals(404, response.getStatus());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
