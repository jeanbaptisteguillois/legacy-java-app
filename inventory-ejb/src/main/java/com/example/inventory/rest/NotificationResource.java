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

import com.example.inventory.entity.NotificationLog;
import com.example.inventory.service.NotificationServiceLocal;

/**
 * REST endpoints exposing the notification log, consumed by the AngularJS
 * frontend's Notification module.
 */
@Stateless
@Path("/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @EJB
    private NotificationServiceLocal notificationService;

    @GET
    public List<NotificationLog> listNotifications() {
        return notificationService.findAll();
    }

    @POST
    @Path("/test")
    public Response sendTestNotification() {
        NotificationLog log = notificationService.send(
                com.example.inventory.entity.NotificationChannel.SYSTEM_LOG,
                "ops@example.com", "Test Notification", "This is a test notification.");
        return Response.status(Response.Status.CREATED).entity(log).build();
    }
}
