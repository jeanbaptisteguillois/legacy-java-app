package com.example.inventory.rest;

import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

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
