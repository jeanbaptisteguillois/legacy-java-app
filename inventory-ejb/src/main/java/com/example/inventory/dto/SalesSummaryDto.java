package com.example.inventory.dto;

import java.io.Serializable;
import java.math.BigDecimal;

import javax.xml.bind.annotation.XmlRootElement;

/**
 * Aggregated sales figures returned by the reporting service.
 */
@XmlRootElement
public class SalesSummaryDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal averageOrderValue;
    private long pendingInvoices;
    private long lowStockProductCount;

    public SalesSummaryDto() {
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public long getPendingInvoices() {
        return pendingInvoices;
    }

    public void setPendingInvoices(long pendingInvoices) {
        this.pendingInvoices = pendingInvoices;
    }

    public long getLowStockProductCount() {
        return lowStockProductCount;
    }

    public void setLowStockProductCount(long lowStockProductCount) {
        this.lowStockProductCount = lowStockProductCount;
    }
}
