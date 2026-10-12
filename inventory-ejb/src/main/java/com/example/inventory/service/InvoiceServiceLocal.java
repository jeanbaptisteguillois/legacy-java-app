package com.example.inventory.service;

import java.util.List;

import javax.ejb.Local;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;

/**
 * Local business interface for invoice generation and billing.
 */
@Local
public interface InvoiceServiceLocal {

    Invoice generateInvoice(Long orderId);

    Invoice markPaid(Long invoiceId);

    Invoice findById(Long invoiceId);

    Invoice findByOrder(Long orderId);

    List<Invoice> findAll();

    List<Invoice> findByPaymentStatus(InvoicePaymentStatus status);
}
