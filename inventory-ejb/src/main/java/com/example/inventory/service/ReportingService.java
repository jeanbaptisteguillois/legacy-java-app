package com.example.inventory.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.apache.log4j.Logger;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;
import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.Product;
import com.example.inventory.util.LoggingUtil;

/**
 * Stateless session bean providing aggregated reporting across the
 * product, order and invoice domains, plus low-stock alert dispatch.
 */
@Stateless
public class ReportingService implements ReportingServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(ReportingService.class);

    private static final String OPS_ALERT_RECIPIENT = "inventory-ops@example.com";

    @PersistenceContext(unitName = "inventoryPU")
    private EntityManager em;

    @EJB
    private ProductServiceLocal productService;

    @EJB
    private NotificationServiceLocal notificationService;

    @Override
    public SalesSummaryDto getSalesSummary() {
        List<Order> orders = em.createNamedQuery("Order.findAll", Order.class).getResultList();
        List<Invoice> pendingInvoices = em.createNamedQuery("Invoice.findAll", Invoice.class)
                .getResultList();

        SalesSummaryDto summary = new SalesSummaryDto();
        summary.setTotalOrders(orders.size());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        for (Order order : orders) {
            if (order.getTotalAmount() != null) {
                totalRevenue = totalRevenue.add(order.getTotalAmount());
            }
        }
        summary.setTotalRevenue(totalRevenue);

        if (!orders.isEmpty()) {
            summary.setAverageOrderValue(
                    totalRevenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP));
        } else {
            summary.setAverageOrderValue(BigDecimal.ZERO);
        }

        long pendingCount = pendingInvoices.stream()
                .filter(i -> i.getPaymentStatus() == InvoicePaymentStatus.PENDING)
                .count();
        summary.setPendingInvoices(pendingCount);

        summary.setLowStockProductCount(productService.findLowStock().size());

        return summary;
    }

    @Override
    public List<LowStockAlertDto> getLowStockAlerts() {
        List<Product> lowStockProducts = productService.findLowStock();
        List<LowStockAlertDto> alerts = new ArrayList<>();
        for (Product product : lowStockProducts) {
            alerts.add(new LowStockAlertDto(
                    product.getId(),
                    product.getSku(),
                    product.getName(),
                    product.getQuantityOnHand(),
                    product.getReorderThreshold()));
        }
        return alerts;
    }

    @Override
    public void dispatchLowStockAlerts() {
        List<LowStockAlertDto> alerts = getLowStockAlerts();
        if (alerts.isEmpty()) {
            LOG.info("No low-stock alerts to dispatch");
            return;
        }

        StringBuilder body = new StringBuilder("The following products are low on stock:\n");
        for (LowStockAlertDto alert : alerts) {
            body.append(" - ").append(alert.getSku()).append(" (").append(alert.getProductName())
                    .append("): ").append(alert.getQuantityOnHand()).append(" remaining\n");
        }

        notificationService.send(NotificationChannel.EMAIL, OPS_ALERT_RECIPIENT,
                "Low Stock Alert", body.toString());
        LOG.warn("Dispatched low-stock alert covering " + alerts.size() + " products");
    }
}
