package com.example.inventory.rest;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.inventory.entity.NotificationLog;
import com.example.inventory.service.NotificationServiceLocal;

/**
 * REST endpoints exposing the notification log, consumed by the AngularJS
 * frontend's Notification module.
 *
 * <p>Migrated from JAX-RS. The {@code @ApplicationPath("/api")} of the former
 * {@code InventoryRestApplication} is preserved as the {@code /api} prefix of
 * this mapping.</p>
 */
@RestController
@RequestMapping(value = "/api/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
public class NotificationResource {

    private final NotificationServiceLocal notificationService;

    public NotificationResource(NotificationServiceLocal notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationLog> listNotifications() {
        return notificationService.findAll();
    }

    @PostMapping("/test")
    public ResponseEntity<NotificationLog> sendTestNotification() {
        NotificationLog log = notificationService.send(
                com.example.inventory.entity.NotificationChannel.SYSTEM_LOG,
                "ops@example.com", "Test Notification", "This is a test notification.");
        return ResponseEntity.status(HttpStatus.CREATED).body(log);
    }
}
