package com.example.inventory.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.slf4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.NotificationLog;
import com.example.inventory.util.LoggingUtil;

/**
 * Spring service responsible for dispatching notifications
 * (order confirmations, low-stock alerts, etc.) and persisting a log entry
 * for each attempt. Migrated from a {@code @Stateless} EJB; the
 * container-managed REQUIRED transaction demarcation is now expressed with
 * {@code @Transactional}.
 *
 * <p>Outbound webhook delivery uses the JDK's built-in
 * {@link java.net.http.HttpClient}, replacing the EOL Apache Commons
 * HttpClient 3.1 library.</p>
 */
@Service
@Transactional
public class NotificationService implements NotificationServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(NotificationService.class);

    /** Placeholder webhook endpoint used to demonstrate outbound HTTP dispatch. */
    private static final String WEBHOOK_URL = "http://localhost:8080/inventory/webhook/notifications";

    @PersistenceContext
    private EntityManager em;

    @Override
    public NotificationLog send(NotificationChannel channel, String recipient, String subject, String body) {
        boolean successful = dispatch(channel, recipient, subject, body);

        NotificationLog log = new NotificationLog();
        log.setChannel(channel);
        log.setRecipient(recipient);
        log.setSubject(subject);
        log.setBody(body);
        log.setSentDate(new Date());
        log.setSuccessful(successful);

        em.persist(log);
        return log;
    }

    private boolean dispatch(NotificationChannel channel, String recipient, String subject, String body) {
        if (channel == NotificationChannel.SYSTEM_LOG) {
            LOG.info("[SYSTEM_LOG] to=" + recipient + " subject=" + subject + " body=" + body);
            return true;
        }

        // EMAIL / SMS notifications are simulated via an outbound webhook call
        // using the JDK HTTP client.
        try {
            String payload = "{\"channel\":\"" + channel + "\",\"recipient\":\"" + recipient
                    + "\",\"subject\":\"" + subject + "\"}";
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest request = HttpRequest.newBuilder(URI.create(WEBHOOK_URL))
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            LOG.info("Dispatched " + channel + " notification to " + recipient
                    + " (status=" + response.statusCode() + ")");
            return true;
        } catch (IOException e) {
            LOG.error("I/O error dispatching notification to " + recipient
                    + " - webhook endpoint may be unavailable in this sample environment", e);
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.error("Interrupted while dispatching notification to " + recipient, e);
            return false;
        }
    }

    @Override
    public List<NotificationLog> findAll() {
        return em.createNamedQuery("NotificationLog.findAll", NotificationLog.class).getResultList();
    }
}
