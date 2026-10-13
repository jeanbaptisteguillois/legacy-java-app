package com.example.inventory.rest;

import java.util.List;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;
import com.example.inventory.service.ReportingServiceLocal;

/**
 * REST endpoints for reporting and alerting, consumed by the AngularJS
 * frontend's Report module.
 */
@Stateless
@Path("/reports")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReportResource {

    @EJB
    private ReportingServiceLocal reportingService;

    @GET
    @Path("/sales-summary")
    public SalesSummaryDto getSalesSummary() {
        return reportingService.getSalesSummary();
    }

    @GET
    @Path("/low-stock-alerts")
    public List<LowStockAlertDto> getLowStockAlerts() {
        return reportingService.getLowStockAlerts();
    }

    @POST
    @Path("/low-stock-alerts/dispatch")
    public Response dispatchLowStockAlerts() {
        reportingService.dispatchLowStockAlerts();
        return Response.accepted().build();
    }
}
