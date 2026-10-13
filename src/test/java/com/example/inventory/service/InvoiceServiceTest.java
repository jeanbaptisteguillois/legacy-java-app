package com.example.inventory.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Arrays;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.entity.Order;

public class InvoiceServiceTest {

    private EntityManager em;
    private OrderServiceLocal orderService;
    private InvoiceService invoiceService;

    @BeforeEach
    public void setUp() throws Exception {
        em = mock(EntityManager.class);
        orderService = mock(OrderServiceLocal.class);

        invoiceService = new InvoiceService(orderService);
        setField(invoiceService, "em", em);
    }

    @Test
    public void generateInvoice_computesTaxAndPersists() {
        Order order = new Order();
        order.setId(1L);
        order.setTotalAmount(new BigDecimal("100.00"));
        when(orderService.findById(1L)).thenReturn(order);

        TypedQuery<Invoice> query = mockEmptyResultQuery();
        when(em.createNamedQuery(eq("Invoice.findByOrder"), eq(Invoice.class))).thenReturn(query);

        Invoice invoice = invoiceService.generateInvoice(1L);

        assertEquals(new BigDecimal("100.00"), invoice.getSubtotal());
        assertEquals(new BigDecimal("8.0000"), invoice.getTaxAmount());
        assertEquals(InvoicePaymentStatus.PENDING, invoice.getPaymentStatus());
        verify(em).persist(invoice);
    }

    @Test
    public void generateInvoice_withUnknownOrder_throws() {
        when(orderService.findById(404L)).thenReturn(null);
        assertThrows(IllegalArgumentException.class, () -> invoiceService.generateInvoice(404L));
    }

    @Test
    public void generateInvoice_whenInvoiceAlreadyExists_returnsExisting() {
        Order order = new Order();
        order.setId(2L);
        when(orderService.findById(2L)).thenReturn(order);

        Invoice existing = new Invoice();
        existing.setId(99L);
        TypedQuery<Invoice> query = mockQuery(existing);
        when(em.createNamedQuery(eq("Invoice.findByOrder"), eq(Invoice.class))).thenReturn(query);

        Invoice result = invoiceService.generateInvoice(2L);

        assertSame(existing, result);
    }

    @Test
    public void markPaid_updatesStatus() {
        Invoice invoice = new Invoice();
        invoice.setId(5L);
        invoice.setPaymentStatus(InvoicePaymentStatus.PENDING);
        when(em.find(Invoice.class, 5L)).thenReturn(invoice);

        Invoice result = invoiceService.markPaid(5L);

        assertEquals(InvoicePaymentStatus.PAID, result.getPaymentStatus());
    }

    @Test
    public void markPaid_whenInvoiceMissing_returnsNull() {
        when(em.find(Invoice.class, 404L)).thenReturn(null);

        assertNull(invoiceService.markPaid(404L));
    }

    @SuppressWarnings("unchecked")
    private TypedQuery<Invoice> mockEmptyResultQuery() {
        TypedQuery<Invoice> query = mock(TypedQuery.class);
        doReturn(query).when(query).setParameter(eq("orderId"), any(Long.class));
        when(query.getSingleResult()).thenThrow(new NoResultException());
        return query;
    }

    @SuppressWarnings("unchecked")
    private TypedQuery<Invoice> mockQuery(Invoice result) {
        TypedQuery<Invoice> query = mock(TypedQuery.class);
        doReturn(query).when(query).setParameter(eq("orderId"), any(Long.class));
        when(query.getSingleResult()).thenReturn(result);
        return query;
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
