package com.example.inventory.rest;

import java.util.List;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.example.inventory.entity.Invoice;
import com.example.inventory.entity.InvoicePaymentStatus;
import com.example.inventory.service.InvoiceServiceLocal;

/**
 * REST endpoints for invoice generation and billing, consumed by the
 * AngularJS frontend's Invoice module.
 */
@Stateless
@Path("/invoices")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InvoiceResource {

    @EJB
    private InvoiceServiceLocal invoiceService;

    @GET
    public List<Invoice> listInvoices(@QueryParam("status") InvoicePaymentStatus status) {
        if (status != null) {
            return invoiceService.findByPaymentStatus(status);
        }
        return invoiceService.findAll();
    }

    @GET
    @Path("/{id}")
    public Response getInvoice(@PathParam("id") Long id) {
        Invoice invoice = invoiceService.findById(id);
        if (invoice == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(invoice).build();
    }

    @POST
    @Path("/generate/{orderId}")
    public Response generateInvoice(@PathParam("orderId") Long orderId) {
        try {
            Invoice invoice = invoiceService.generateInvoice(orderId);
            return Response.status(Response.Status.CREATED).entity(invoice).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
    }

    @PUT
    @Path("/{id}/mark-paid")
    public Response markPaid(@PathParam("id") Long id) {
        Invoice updated = invoiceService.markPaid(id);
        if (updated == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(updated).build();
    }
}
