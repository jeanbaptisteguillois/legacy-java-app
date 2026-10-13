package com.example.inventory.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.http.ResponseEntity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.service.InvoiceServiceLocal;

public class InvoiceResourceTest {

    private InvoiceServiceLocal invoiceService;
    private InvoiceResource resource;

    @BeforeEach
    public void setUp() {
        invoiceService = mock(InvoiceServiceLocal.class);
        resource = new InvoiceResource(invoiceService);
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

        ResponseEntity<?> response = resource.getInvoice(404L);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    public void generateInvoice_onSuccess_returnsCreated() {
        Invoice invoice = new Invoice();
        when(invoiceService.generateInvoice(1L)).thenReturn(invoice);

        ResponseEntity<?> response = resource.generateInvoice(1L);

        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    public void generateInvoice_onInvalidOrder_returnsBadRequest() {
        when(invoiceService.generateInvoice(404L)).thenThrow(new IllegalArgumentException("No order"));

        ResponseEntity<?> response = resource.generateInvoice(404L);

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    public void markPaid_whenMissing_returnsNotFound() {
        when(invoiceService.markPaid(404L)).thenReturn(null);

        ResponseEntity<?> response = resource.markPaid(404L);

        assertEquals(404, response.getStatusCode().value());
    }
}
