package com.example.inventory.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

/**
 * Inbound payload for placing a new order: a customer id plus the
 * requested product/quantity line items.
 */
@XmlRootElement
public class OrderRequestDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long customerId;
    private List<OrderLineItemRequestDto> lineItems = new ArrayList<>();

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public List<OrderLineItemRequestDto> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<OrderLineItemRequestDto> lineItems) {
        this.lineItems = lineItems;
    }

    public static class OrderLineItemRequestDto implements Serializable {

        private static final long serialVersionUID = 1L;

        private Long productId;
        private int quantity;

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}
