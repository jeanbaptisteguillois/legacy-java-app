package com.example.inventory.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;

import org.junit.Before;
import org.junit.Test;

import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.NotificationLog;

public class NotificationServiceTest {

    private EntityManager em;
    private NotificationService notificationService;

    @Before
    public void setUp() throws Exception {
        em = mock(EntityManager.class);
        notificationService = new NotificationService();
        setField(notificationService, "em", em);
    }

    @Test
    public void send_systemLogChannel_isAlwaysSuccessful() {
        NotificationLog log = notificationService.send(
                NotificationChannel.SYSTEM_LOG, "ops@example.com", "Subject", "Body");

        assertTrue(log.isSuccessful());
        assertEquals(NotificationChannel.SYSTEM_LOG, log.getChannel());
        verify(em).persist(log);
    }

    @Test
    public void send_persistsRecipientAndSubject() {
        NotificationLog log = notificationService.send(
                NotificationChannel.SYSTEM_LOG, "alice@example.com", "Order Confirmation", "Thanks!");

        assertEquals("alice@example.com", log.getRecipient());
        assertEquals("Order Confirmation", log.getSubject());
    }

    @Test
    public void send_emailChannel_attemptsWebhookDispatchAndLogsResult() {
        // The webhook endpoint is not reachable in the unit test environment,
        // so dispatch is expected to fail gracefully and still persist a log.
        NotificationLog log = notificationService.send(
                NotificationChannel.EMAIL, "bob@example.com", "Order Shipped", "Your order shipped.");

        assertEquals(NotificationChannel.EMAIL, log.getChannel());
        verify(em).persist(log);
    }

    @Test
    public void send_setsSentDate() {
        NotificationLog log = notificationService.send(
                NotificationChannel.SYSTEM_LOG, "ops@example.com", "Subject", "Body");

        assertTrue(log.getSentDate() != null);
    }

    @SuppressWarnings("unchecked")
    @Test
    public void findAll_returnsAllLoggedNotifications() {
        TypedQuery<NotificationLog> query = mock(TypedQuery.class);
        when(em.createNamedQuery(eq("NotificationLog.findAll"), eq(NotificationLog.class))).thenReturn(query);
        when(query.getResultList()).thenReturn(Arrays.asList(new NotificationLog(), new NotificationLog()));

        assertEquals(2, notificationService.findAll().size());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
