package com.example.inventory.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.http.ResponseEntity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.NotificationLog;
import com.example.inventory.service.NotificationServiceLocal;

public class NotificationResourceTest {

    private NotificationServiceLocal notificationService;
    private NotificationResource resource;

    @BeforeEach
    public void setUp() {
        notificationService = mock(NotificationServiceLocal.class);
        resource = new NotificationResource(notificationService);
    }

    @Test
    public void listNotifications_returnsAllFromService() {
        when(notificationService.findAll()).thenReturn(Arrays.asList(new NotificationLog(), new NotificationLog()));

        assertEquals(2, resource.listNotifications().size());
    }

    @Test
    public void listNotifications_whenEmpty_returnsEmptyList() {
        when(notificationService.findAll()).thenReturn(Collections.emptyList());

        assertEquals(0, resource.listNotifications().size());
    }

    @Test
    public void sendTestNotification_returnsCreatedStatus() {
        NotificationLog log = new NotificationLog();
        when(notificationService.send(eq(NotificationChannel.SYSTEM_LOG), any(), any(), any())).thenReturn(log);

        ResponseEntity<?> response = resource.sendTestNotification();

        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    public void sendTestNotification_usesSystemLogChannel() {
        NotificationLog log = new NotificationLog();
        when(notificationService.send(eq(NotificationChannel.SYSTEM_LOG), any(), any(), any())).thenReturn(log);

        resource.sendTestNotification();

        verify(notificationService).send(eq(NotificationChannel.SYSTEM_LOG), any(), any(), any());
    }

    @Test
    public void sendTestNotification_returnsLogEntity() {
        NotificationLog log = new NotificationLog();
        log.setSubject("Test Notification");
        when(notificationService.send(eq(NotificationChannel.SYSTEM_LOG), any(), any(), any())).thenReturn(log);

        ResponseEntity<?> response = resource.sendTestNotification();

        assertEquals(log, response.getBody());
    }
}
