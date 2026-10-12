package com.example.inventory.service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.apache.log4j.Logger;

import com.example.inventory.dto.OrderRequestDto;
import com.example.inventory.dto.OrderRequestDto.OrderLineItemRequestDto;
import com.example.inventory.entity.Customer;
import com.example.inventory.entity.NotificationChannel;
import com.example.inventory.entity.Order;
import com.example.inventory.entity.OrderLineItem;
import com.example.inventory.entity.OrderStatus;
import com.example.inventory.entity.Product;
import com.example.inventory.util.LoggingUtil;

/**
 * Stateless session bean implementing order placement and lifecycle
 * management. Coordinates with {@link ProductServiceLocal},
 * {@link CustomerServiceLocal} and {@link NotificationServiceLocal}.
 */
@Stateless
public class OrderService implements OrderServiceLocal {

    private static final Logger LOG = LoggingUtil.getLogger(OrderService.class);

    @PersistenceContext(unitName = "inventoryPU")
    private EntityManager em;

    @EJB
    private ProductServiceLocal productService;

    @EJB
    private CustomerServiceLocal customerService;

    @EJB
    private NotificationServiceLocal notificationService;

    @Override
    public Order placeOrder(OrderRequestDto request) {
        if (request == null || request.getCustomerId() == null) {
            throw new IllegalArgumentException("Order request must specify a customer");
        }
        if (request.getLineItems() == null || request.getLineItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one line item");
        }

        Customer customer = customerService.findById(request.getCustomerId());
        if (customer == null) {
            throw new IllegalArgumentException("No customer with id " + request.getCustomerId());
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderDate(new Date());
        order.setStatus(OrderStatus.NEW);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderLineItemRequestDto itemRequest : request.getLineItems()) {
            Product product = productService.findById(itemRequest.getProductId());
            if (product == null) {
                throw new IllegalArgumentException("No product with id " + itemRequest.getProductId());
            }

            OrderLineItem lineItem = new OrderLineItem();
            lineItem.setOrder(order);
            lineItem.setProduct(product);
            lineItem.setQuantity(itemRequest.getQuantity());
            lineItem.setUnitPriceAtOrder(product.getUnitPrice());
            order.getLineItems().add(lineItem);

            total = total.add(lineItem.getSubtotal());

            productService.adjustStock(product.getId(), -itemRequest.getQuantity());
        }
        order.setTotalAmount(total);

        em.persist(order);

        LOG.info("Placed order id=" + order.getId() + " for customer=" + customer.getEmail()
                + " total=" + total);

        notificationService.send(NotificationChannel.EMAIL, customer.getEmail(),
                "Order Confirmation", "Your order has been received and is being processed.");

        return order;
    }

    @Override
    public Order updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = findById(orderId);
        if (order == null) {
            return null;
        }
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.SHIPPED) {
            notificationService.send(NotificationChannel.EMAIL, order.getCustomer().getEmail(),
                    "Order Shipped", "Your order #" + order.getId() + " has shipped.");
        }
        return order;
    }

    @Override
    public void cancelOrder(Long orderId) {
        Order order = findById(orderId);
        if (order == null) {
            return;
        }
        // Restock items for cancelled orders.
        for (OrderLineItem lineItem : order.getLineItems()) {
            productService.adjustStock(lineItem.getProduct().getId(), lineItem.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
    }

    @Override
    public Order findById(Long orderId) {
        return em.find(Order.class, orderId);
    }

    @Override
    public List<Order> findAll() {
        return em.createNamedQuery("Order.findAll", Order.class).getResultList();
    }

    @Override
    public List<Order> findByCustomer(Long customerId) {
        return em.createNamedQuery("Order.findByCustomer", Order.class)
                .setParameter("customerId", customerId)
                .getResultList();
    }

    @Override
    public List<Order> findByStatus(OrderStatus status) {
        return em.createNamedQuery("Order.findByStatus", Order.class)
                .setParameter("status", status)
                .getResultList();
    }
}
