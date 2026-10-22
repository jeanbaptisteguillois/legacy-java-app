package com.example.inventory.rest;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

/**
 * JAX-RS application activator. All resource classes under
 * {@code com.example.inventory.rest} are discovered automatically.
 */
@ApplicationPath("/api")
public class InventoryRestApplication extends Application {
}
