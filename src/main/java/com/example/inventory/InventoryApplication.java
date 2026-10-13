package com.example.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the Inventory Management System.
 *
 * <p>Replaces the WildFly EAR deployment model: the application now runs as a
 * standalone executable JAR with an embedded servlet container.</p>
 */
@SpringBootApplication
public class InventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
