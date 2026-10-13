package com.example.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;
import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.Product;

public class ReportingServiceTest {

    private EntityManager em;
    private ProductServiceLocal productService;
    private NotificationServiceLocal notificationService;
    private ReportingService reportingService;

    @BeforeEach
    public void setUp() throws Exception {
        em = mock(EntityManager.class);
        productService = mock(ProductServiceLocal.class);
        notificationService = mock(NotificationServiceLocal.class);

        reportingService = new ReportingService(productService, notificationService);
        setField(reportingService, "em", em);
    }

    @SuppressWarnings("unchecked")
    @Test
    public void getSalesSummary_computesTotalsAndAverage() {
        Order o1 = new Order();
        o1.setTotalAmount(new BigDecimal("100.00"));
        Order o2 = new Order();
        o2.setTotalAmount(new BigDecimal("50.00"));

        TypedQuery<Order> orderQuery = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Order.findAll"), eq(Order.class))).thenReturn(orderQuery);
        when(orderQuery.getResultList()).thenReturn(Arrays.asList(o1, o2));

        TypedQuery<Invoice> invoiceQuery = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Invoice.findAll"), eq(Invoice.class))).thenReturn(invoiceQuery);
        when(invoiceQuery.getResultList()).thenReturn(Collections.emptyList());

        when(productService.findLowStock()).thenReturn(Collections.emptyList());

        SalesSummaryDto summary = reportingService.getSalesSummary();

        assertEquals(2, summary.getTotalOrders());
        assertEquals(new BigDecimal("150.00"), summary.getTotalRevenue());
        assertEquals(new BigDecimal("75.00"), summary.getAverageOrderValue());
    }

    @SuppressWarnings("unchecked")
    @Test
    public void getSalesSummary_withNoOrders_averageIsZero() {
        TypedQuery<Order> orderQuery = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Order.findAll"), eq(Order.class))).thenReturn(orderQuery);
        when(orderQuery.getResultList()).thenReturn(Collections.emptyList());

        TypedQuery<Invoice> invoiceQuery = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Invoice.findAll"), eq(Invoice.class))).thenReturn(invoiceQuery);
        when(invoiceQuery.getResultList()).thenReturn(Collections.emptyList());

        when(productService.findLowStock()).thenReturn(Collections.emptyList());

        SalesSummaryDto summary = reportingService.getSalesSummary();

        assertEquals(BigDecimal.ZERO, summary.getAverageOrderValue());
    }

    @SuppressWarnings("unchecked")
    @Test
    public void getSalesSummary_countsPendingInvoices() {
        TypedQuery<Order> orderQuery = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Order.findAll"), eq(Order.class))).thenReturn(orderQuery);
        when(orderQuery.getResultList()).thenReturn(Collections.emptyList());

        Invoice pending = new Invoice();
        pending.setPaymentStatus(InvoicePaymentStatus.PENDING);
        Invoice paid = new Invoice();
        paid.setPaymentStatus(InvoicePaymentStatus.PAID);

        TypedQuery<Invoice> invoiceQuery = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("Invoice.findAll"), eq(Invoice.class))).thenReturn(invoiceQuery);
        when(invoiceQuery.getResultList()).thenReturn(Arrays.asList(pending, paid));

        when(productService.findLowStock()).thenReturn(Collections.emptyList());

        SalesSummaryDto summary = reportingService.getSalesSummary();

        assertEquals(1, summary.getPendingInvoices());
    }

    @Test
    public void getLowStockAlerts_mapsProductsToDtos() {
        Product product = new Product();
        product.setId(1L);
        product.setSku("SKU-1");
        product.setName("Widget");
        product.setQuantityOnHand(2);
        product.setReorderThreshold(10);
        when(productService.findLowStock()).thenReturn(Collections.singletonList(product));

        List<LowStockAlertDto> alerts = reportingService.getLowStockAlerts();

        assertEquals(1, alerts.size());
        assertEquals("SKU-1", alerts.get(0).getSku());
        assertEquals(2, alerts.get(0).getQuantityOnHand());
    }

    @Test
    public void dispatchLowStockAlerts_withNoAlerts_doesNotSendNotification() {
        when(productService.findLowStock()).thenReturn(Collections.emptyList());

        reportingService.dispatchLowStockAlerts();

        verify(notificationService, never()).send(any(), any(), any(), any());
    }

    @Test
    public void dispatchLowStockAlerts_withAlerts_sendsOneNotification() {
        Product product = new Product();
        product.setId(1L);
        product.setSku("SKU-1");
        product.setName("Widget");
        product.setQuantityOnHand(1);
        product.setReorderThreshold(10);
        when(productService.findLowStock()).thenReturn(Collections.singletonList(product));

        reportingService.dispatchLowStockAlerts();

        verify(notificationService, times(1)).send(eq(NotificationChannel.EMAIL), any(), any(), any());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
