package com.example.inventory.service;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.inventory.entity.Customer;
import com.example.inventory.entity.Product;
import com.example.inventory.util.LoggingUtil;

/**
 * Seeds the H2 database with sample products and customers on application
 * startup, so the AngularJS frontend has data to display out of the box.
 *
 * <p>Migrated from a {@code @Singleton @Startup} EJB whose {@code @PostConstruct}
 * ran at deployment time. As a Spring {@link CommandLineRunner} the same
 * {@link #seed()} method runs once the application context is fully started,
 * inside an explicit transaction.</p>
 */
@Component
public class DataSeederBean implements CommandLineRunner {

    private static final Logger LOG = LoggingUtil.getLogger(DataSeederBean.class);

    private final ProductServiceLocal productService;

    private final CustomerServiceLocal customerService;

    public DataSeederBean(ProductServiceLocal productService,
                          CustomerServiceLocal customerService) {
        this.productService = productService;
        this.customerService = customerService;
    }

    @Override
    public void run(String... args) {
        seed();
    }

    @Transactional
    public void seed() {
        LOG.info("Seeding sample inventory data...");

        seedProduct("SKU-1001", "Wireless Mouse", "Ergonomic wireless mouse with USB receiver", "19.99", 150, 20);
        seedProduct("SKU-1002", "Mechanical Keyboard", "Tenkeyless mechanical keyboard, blue switches", "79.99", 60, 10);
        seedProduct("SKU-1003", "27-inch Monitor", "27-inch 1440p IPS monitor", "249.99", 8, 10);
        seedProduct("SKU-1004", "USB-C Dock", "11-in-1 USB-C docking station", "89.99", 45, 15);
        seedProduct("SKU-1005", "Laptop Stand", "Aluminum adjustable laptop stand", "34.99", 5, 15);

        seedCustomer("Alice", "Nguyen", "alice.nguyen@example.com", "+1-555-0101", "123 Main St, Springfield");
        seedCustomer("Bob", "Martinez", "bob.martinez@example.com", "+1-555-0102", "456 Oak Ave, Springfield");
        seedCustomer("Chloe", "Dubois", "chloe.dubois@example.com", "+1-555-0103", "789 Pine Rd, Springfield");

        LOG.info("Sample inventory data seeding complete.");
    }

    private void seedProduct(String sku, String name, String description, String price, int quantity, int reorderThreshold) {
        if (productService.findBySku(sku) != null) {
            return;
        }
        Product product = new Product();
        product.setSku(sku);
        product.setName(name);
        product.setDescription(description);
        product.setUnitPrice(new BigDecimal(price));
        product.setQuantityOnHand(quantity);
        product.setReorderThreshold(reorderThreshold);
        productService.createProduct(product);
    }

    private void seedCustomer(String firstName, String lastName, String email, String phone, String address) {
        if (customerService.findByEmail(email) != null) {
            return;
        }
        Customer customer = new Customer();
        customer.setFirstName(firstName);
        customer.setLastName(lastName);
        customer.setEmail(email);
        customer.setPhone(phone);
        customer.setShippingAddress(address);
        customerService.createCustomer(customer);
    }
}
