package com.example.inventory.rest;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.service.InvoiceServiceLocal;

/**
 * REST endpoints for invoice generation and billing, consumed by the
 * AngularJS frontend's Invoice module.
 *
 * <p>Migrated from JAX-RS. The {@code @ApplicationPath("/api")} of the former
 * {@code InventoryRestApplication} is preserved as the {@code /api} prefix of
 * this mapping.</p>
 */
@RestController
@RequestMapping(value = "/api/invoices", produces = MediaType.APPLICATION_JSON_VALUE)
public class InvoiceResource {

    private final InvoiceServiceLocal invoiceService;

    public InvoiceResource(InvoiceServiceLocal invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<Invoice> listInvoices(@RequestParam(value = "status", required = false) InvoicePaymentStatus status) {
        if (status != null) {
            return invoiceService.findByPaymentStatus(status);
        }
        return invoiceService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable("id") Long id) {
        Invoice invoice = invoiceService.findById(id);
        if (invoice == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(invoice);
    }

    @PostMapping("/generate/{orderId}")
    public ResponseEntity<?> generateInvoice(@PathVariable("orderId") Long orderId) {
        try {
            Invoice invoice = invoiceService.generateInvoice(orderId);
            return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<Invoice> markPaid(@PathVariable("id") Long id) {
        Invoice updated = invoiceService.markPaid(id);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(updated);
    }
}
