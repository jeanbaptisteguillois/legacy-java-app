package com.example.inventory.service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.log4j.Logger;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.entity.Order;
import com.example.inventory.util.InvoiceNumberGenerator;
import com.example.inventory.util.LoggingUtil;

/**
 * Stateless session bean implementing invoice generation and billing.
 *
 * <p>Uses Jackson Databind 2.9.x to serialize an audit snapshot of the order
 * at invoicing time. That Jackson line is intentionally outdated (carries
 * multiple known CVEs) for modernization-tooling detection purposes.</p>
 */
@Stateless
public class InvoiceService implements InvoiceServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(InvoiceService.class);

    private static final BigDecimal TAX_RATE = new BigDecimal("0.08");

    @PersistenceContext(unitName = "inventoryPU")
    private EntityManager em;

    @EJB
    private OrderServiceLocal orderService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Invoice generateInvoice(Long orderId) {
        Order order = orderService.findById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("No order with id " + orderId);
        }

        Invoice existing = findByOrder(orderId);
        if (existing != null) {
            LOG.info("Invoice already exists for order " + orderId + ", returning existing invoice");
            return existing;
        }

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setIssueDate(new Date());
        invoice.setInvoiceNumber(InvoiceNumberGenerator.generate(invoice.getIssueDate()));

        BigDecimal subtotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal tax = subtotal.multiply(TAX_RATE);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(tax);
        invoice.setTotalAmount(subtotal.add(tax));
        invoice.setPaymentStatus(InvoicePaymentStatus.PENDING);

        em.persist(invoice);

        logAuditSnapshot(order, invoice);

        return invoice;
    }

    private void logAuditSnapshot(Order order, Invoice invoice) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("orderId", order.getId());
        snapshot.put("invoiceNumber", invoice.getInvoiceNumber());
        snapshot.put("subtotal", invoice.getSubtotal());
        snapshot.put("taxAmount", invoice.getTaxAmount());
        snapshot.put("totalAmount", invoice.getTotalAmount());

        try {
            String json = objectMapper.writeValueAsString(snapshot);
            LOG.info("Invoice audit snapshot: " + json);
        } catch (JsonProcessingException e) {
            LOG.error("Failed to serialize invoice audit snapshot for order " + order.getId(), e);
        }
    }

    @Override
    public Invoice markPaid(Long invoiceId) {
        Invoice invoice = findById(invoiceId);
        if (invoice == null) {
            return null;
        }
        invoice.setPaymentStatus(InvoicePaymentStatus.PAID);
        return invoice;
    }

    @Override
    public Invoice findById(Long invoiceId) {
        return em.find(Invoice.class, invoiceId);
    }

    @Override
    public Invoice findByOrder(Long orderId) {
        try {
            return em.createNamedQuery("Invoice.findByOrder", Invoice.class)
                    .setParameter("orderId", orderId)
                    .getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    @Override
    public List<Invoice> findAll() {
        return em.createNamedQuery("Invoice.findAll", Invoice.class).getResultList();
    }

    @Override
    public List<Invoice> findByPaymentStatus(InvoicePaymentStatus status) {
        return em.createQuery(
                "SELECT i FROM Invoice i WHERE i.paymentStatus = :status ORDER BY i.issueDate DESC",
                Invoice.class)
                .setParameter("status", status)
                .getResultList();
    }
}
