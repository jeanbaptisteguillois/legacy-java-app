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

import com.example.inventory.dto.OrderRequestDto;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.OrderStatus;
import com.example.inventory.service.OrderServiceLocal;

/**
 * REST endpoints for order placement and lifecycle management, consumed
 * by the AngularJS frontend's Order module.
 */
@Stateless
@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrderResource {

    @EJB
    private OrderServiceLocal orderService;

    @GET
    public List<Order> listOrders(@QueryParam("customerId") Long customerId,
                                   @QueryParam("status") OrderStatus status) {
        if (customerId != null) {
            return orderService.findByCustomer(customerId);
        }
        if (status != null) {
            return orderService.findByStatus(status);
        }
        return orderService.findAll();
    }

    @GET
    @Path("/{id}")
    public Response getOrder(@PathParam("id") Long id) {
        Order order = orderService.findById(id);
        if (order == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(order).build();
    }

    @POST
    public Response placeOrder(OrderRequestDto request) {
        try {
            Order order = orderService.placeOrder(request);
            return Response.status(Response.Status.CREATED).entity(order).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
    }

    @PUT
    @Path("/{id}/status")
    public Response updateStatus(@PathParam("id") Long id, @QueryParam("value") OrderStatus newStatus) {
        Order updated = orderService.updateStatus(id, newStatus);
        if (updated == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(updated).build();
    }

    @PUT
    @Path("/{id}/cancel")
    public Response cancelOrder(@PathParam("id") Long id) {
        orderService.cancelOrder(id);
        return Response.noContent().build();
    }
}
