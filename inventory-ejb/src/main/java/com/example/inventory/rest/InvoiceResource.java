package com.example.inventory.rest;

import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

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
