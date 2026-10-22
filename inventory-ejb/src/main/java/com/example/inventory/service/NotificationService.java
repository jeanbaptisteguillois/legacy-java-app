package com.example.inventory.service;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpException;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.apache.log4j.Logger;

import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.NotificationLog;
import com.example.inventory.util.LoggingUtil;

/**
 * Stateless session bean responsible for dispatching notifications
 * (order confirmations, low-stock alerts, etc.) and persisting a log entry
 * for each attempt.
 *
 * <p>Outbound webhook delivery uses Apache Commons HttpClient 3.1
 * ({@code commons-httpclient}), an EOL library superseded by
 * Apache HttpComponents HttpClient. Retained deliberately for this sample
 * application.</p>
 */
@Stateless
public class NotificationService implements NotificationServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(NotificationService.class);

    /** Placeholder webhook endpoint used to demonstrate outbound HTTP dispatch. */
    private static final String WEBHOOK_URL = "http://localhost:8080/inventory/webhook/notifications";

    @PersistenceContext(unitName = "inventoryPU")
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
        // using the legacy Commons HttpClient 3.1 API.
        HttpClient client = new HttpClient();
        PostMethod post = new PostMethod(WEBHOOK_URL);
        try {
            String payload = "{\"channel\":\"" + channel + "\",\"recipient\":\"" + recipient
                    + "\",\"subject\":\"" + subject + "\"}";
            post.setRequestEntity(new StringRequestEntity(payload, "application/json", "UTF-8"));
            client.executeMethod(post);
            LOG.info("Dispatched " + channel + " notification to " + recipient
                    + " (status=" + post.getStatusCode() + ")");
            return true;
        } catch (HttpException e) {
            LOG.error("HTTP protocol error dispatching notification to " + recipient, e);
            return false;
        } catch (IOException e) {
            LOG.error("I/O error dispatching notification to " + recipient
                    + " - webhook endpoint may be unavailable in this sample environment", e);
            return false;
        } finally {
            post.releaseConnection();
        }
    }

    @Override
    public List<NotificationLog> findAll() {
        return em.createNamedQuery("NotificationLog.findAll", NotificationLog.class).getResultList();
    }
}
