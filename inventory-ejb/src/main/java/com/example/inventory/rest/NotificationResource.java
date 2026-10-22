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
