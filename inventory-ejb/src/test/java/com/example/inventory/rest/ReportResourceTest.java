package com.example.inventory.rest;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;

import jakarta.ws.rs.core.Response;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;
import com.example.inventory.service.ReportingServiceLocal;

public class ReportResourceTest {

    private ReportingServiceLocal reportingService;
    private ReportResource resource;

    @Before
    public void setUp() throws Exception {
        reportingService = mock(ReportingServiceLocal.class);
        resource = new ReportResource();
        setField(resource, "reportingService", reportingService);
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
        Response response = resource.dispatchLowStockAlerts();

        assertEquals(202, response.getStatus());
    }

    @Test
    public void dispatchLowStockAlerts_invokesServiceExactlyOnce() {
        resource.dispatchLowStockAlerts();

        verify(reportingService, times(1)).dispatchLowStockAlerts();
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
