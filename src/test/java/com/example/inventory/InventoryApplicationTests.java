package com.example.inventory;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Spring Boot integration tests replacing the WildFly deployment smoke check.
 *
 * <p>Verifies that the application context starts standalone, that the REST API
 * is still served under the {@code /api} prefix inherited from the former
 * {@code @ApplicationPath}, that the {@code DataSeederBean} startup seeding
 * still runs, that Actuator reports the application healthy, and that the
 * AngularJS single-page frontend is served as the welcome file at {@code /}.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
class InventoryApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoadsAndSeedDataIsExposedOverTheApi() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[?(@.sku=='SKU-1001')].name").value("Wireless Mouse"));
    }

    @Test
    void customersAreSeeded() throws Exception {
        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void unknownProductReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/products/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void salesSummaryReportIsAvailable() throws Exception {
        mockMvc.perform(get("/api/reports/sales-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(0));
    }

    @Test
    void lowStockAlertsAreComputedFromSeedData() throws Exception {
        mockMvc.perform(get("/api/reports/low-stock-alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void actuatorHealthReportsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void staticSinglePageFrontendIsServedAsWelcomeFile() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk());
    }
}
