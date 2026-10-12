package com.example.inventory.dto;

import java.io.Serializable;

import javax.xml.bind.annotation.XmlRootElement;

/**
 * Lightweight transfer object describing a product that has fallen at or
 * below its reorder threshold.
 */
@XmlRootElement
public class LowStockAlertDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long productId;
    private String sku;
    private String productName;
    private int quantityOnHand;
    private int reorderThreshold;

    public LowStockAlertDto() {
    }

    public LowStockAlertDto(Long productId, String sku, String productName, int quantityOnHand, int reorderThreshold) {
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.quantityOnHand = quantityOnHand;
        this.reorderThreshold = reorderThreshold;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getQuantityOnHand() {
        return quantityOnHand;
    }

    public void setQuantityOnHand(int quantityOnHand) {
        this.quantityOnHand = quantityOnHand;
    }

    public int getReorderThreshold() {
        return reorderThreshold;
    }

    public void setReorderThreshold(int reorderThreshold) {
        this.reorderThreshold = reorderThreshold;
    }
}
