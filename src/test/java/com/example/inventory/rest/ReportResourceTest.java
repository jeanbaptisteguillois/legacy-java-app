package com.example.inventory.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;

import org.springframework.http.ResponseEntity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;
import com.example.inventory.service.ReportingServiceLocal;

public class ReportResourceTest {

    private ReportingServiceLocal reportingService;
    private ReportResource resource;

    @BeforeEach
    public void setUp() {
        reportingService = mock(ReportingServiceLocal.class);
        resource = new ReportResource(reportingService);
    }

    @Test
    public void getSalesSummary_delegatesToService() {
        SalesSummaryDto summary = new SalesSummaryDto();
        when(reportingService.getSalesSummary()).thenReturn(summary);

        assertEquals(summary, resource.getSalesSummary());
    }

    @Test
    public void getLowStockAlerts_delegatesToService() {
        when(reportingService.getLowStockAlerts())
                .thenReturn(Collections.singletonList(new LowStockAlertDto()));

        assertEquals(1, resource.getLowStockAlerts().size());
    }

    @Test
    public void getLowStockAlerts_whenEmpty_returnsEmptyList() {
        when(reportingService.getLowStockAlerts()).thenReturn(Collections.emptyList());

        assertEquals(0, resource.getLowStockAlerts().size());
    }

    @Test
    public void dispatchLowStockAlerts_returnsAcceptedStatus() {
        ResponseEntity<?> response = resource.dispatchLowStockAlerts();

        assertEquals(202, response.getStatusCode().value());
    }

    @Test
    public void dispatchLowStockAlerts_invokesServiceExactlyOnce() {
        resource.dispatchLowStockAlerts();

        verify(reportingService, times(1)).dispatchLowStockAlerts();
    }
}
