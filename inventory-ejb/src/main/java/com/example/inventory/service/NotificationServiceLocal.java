package com.example.inventory.service;

import java.util.List;

import jakarta.ejb.Local;

import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.NotificationLog;

/**
 * Local business interface for dispatching and logging notifications.
 */
@Local
public interface NotificationServiceLocal {

    NotificationLog send(NotificationChannel channel, String recipient, String subject, String body);

    List<NotificationLog> findAll();
}
