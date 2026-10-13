package com.example.inventory.entity;

import java.io.Serializable;
import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.xml.bind.annotation.XmlRootElement;

/**
 * Record of a notification dispatched (or attempted) to a customer or
 * internal operator, e.g. order confirmation or low-stock alert.
 */
@Entity
@Table(name = "NOTIFICATION_LOG")
@XmlRootElement
@NamedQuery(name = "NotificationLog.findAll", query = "SELECT n FROM NotificationLog n ORDER BY n.sentDate DESC")
public class NotificationLog implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NOTIFICATION_ID")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "CHANNEL", nullable = false, length = 32)
    private NotificationChannel channel;

    @Column(name = "RECIPIENT", nullable = false, length = 128)
    private String recipient;

    @Column(name = "SUBJECT", length = 256)
    private String subject;

    @Column(name = "BODY", length = 2048)
    private String body;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "SENT_DATE", nullable = false)
    private Date sentDate;

    @Column(name = "SUCCESSFUL", nullable = false)
    private boolean successful;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Date getSentDate() {
        return sentDate;
    }

    public void setSentDate(Date sentDate) {
        this.sentDate = sentDate;
    }

    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }
}
