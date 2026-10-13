package com.example.inventory.rest;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;
import com.example.inventory.service.ReportingServiceLocal;

/**
 * REST endpoints for reporting and alerting, consumed by the AngularJS
 * frontend's Report module.
 *
 * <p>Migrated from JAX-RS. The {@code @ApplicationPath("/api")} of the former
 * {@code InventoryRestApplication} is preserved as the {@code /api} prefix of
 * this mapping.</p>
 */
@RestController
@RequestMapping(value = "/api/reports", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReportResource {

    private final ReportingServiceLocal reportingService;

    public ReportResource(ReportingServiceLocal reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/sales-summary")
    public SalesSummaryDto getSalesSummary() {
        return reportingService.getSalesSummary();
    }

    @GetMapping("/low-stock-alerts")
    public List<LowStockAlertDto> getLowStockAlerts() {
        return reportingService.getLowStockAlerts();
    }

    @PostMapping("/low-stock-alerts/dispatch")
    public ResponseEntity<Void> dispatchLowStockAlerts() {
        reportingService.dispatchLowStockAlerts();
        return ResponseEntity.accepted().build();
    }
}
