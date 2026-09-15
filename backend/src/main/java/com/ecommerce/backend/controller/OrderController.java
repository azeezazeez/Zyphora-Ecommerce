package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.*;
import com.ecommerce.backend.entity.*;
import com.ecommerce.backend.repository.*;
import com.ecommerce.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private OrderResponse convertToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            itemResponses = order.getItems().stream()
                    .map(item -> new OrderItemResponse(
                            item.getProductId(),
                            item.getProductName(),
                            item.getPrice(),
                            item.getQuantity(),
                            item.getSubtotal()
                    ))
                    .collect(Collectors.toList());
        }
        return new OrderResponse(
                order.getOrderId(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getStatus(),
                itemResponses
        );
    }

    @PostMapping("/place/{userId}")
    @Transactional
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> request) {

        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + userId));
            }

            List<CartItem> cartItems = cartRepository.findByUserId(userId);
            if (cartItems.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Cannot place order with empty cart"));
            }

            Order order = new Order();
            order.setUserId(userId);
            order.setStatus(OrderStatus.PENDING);

            Double totalAmount = 0.0;
            List<OrderItem> orderItems = new ArrayList<>();

            for (CartItem cartItem : cartItems) {
                Long productIdLong;
                try {
                    productIdLong = Long.parseLong(cartItem.getProductId());
                } catch (NumberFormatException e) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.error("Invalid product ID: " + cartItem.getProductId()));
                }

                Product product = productRepository.findById(productIdLong).orElse(null);
                if (product == null) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.error("Product not found: " + cartItem.getProductId()));
                }

                // Correct stock check: is there enough stock for the requested quantity?
                if (product.getStock() != null && product.getStock() < cartItem.getQuantity()) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.error("Insufficient stock for: " + product.getName()
                                    + ". Available: " + product.getStock()));
                }

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setProductId(cartItem.getProductId());
                orderItem.setProductName(product.getName());
                orderItem.setPrice(product.getPrice());
                orderItem.setQuantity(cartItem.getQuantity());
                orderItem.setSubtotal(product.getPrice() * cartItem.getQuantity());

                orderItems.add(orderItem);
                totalAmount += orderItem.getSubtotal();
            }

            order.setTotalAmount(totalAmount);
            order.setItems(orderItems);

            Order savedOrder = orderRepository.save(order);

            // Clear cart after successful save
            cartRepository.deleteAllByUserId(userId);

            // Send a clean HTML order confirmation after the order is persisted.
            emailService.sendOrderConfirmation(user.getEmail(), user.getUsername(), savedOrder);

            // Update stock
            for (CartItem cartItem : cartItems) {
                try {
                    Long productIdLong = Long.parseLong(cartItem.getProductId());
                    productRepository.findById(productIdLong).ifPresent(product -> {
                        if (product.getStock() != null) {
                            product.setStock(Math.max(product.getStock() - cartItem.getQuantity(), 0));
                            productRepository.save(product);
                        }
                    });
                } catch (NumberFormatException ignored) {
                }
            }

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Order placed successfully", convertToOrderResponse(savedOrder)));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to place order: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrderHistory(@PathVariable Long userId) {

        try {
            if (!userRepository.existsById(userId)) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + userId));
            }

            List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);

            List<OrderResponse> response = orders.stream()
                    .map(this::convertToOrderResponse)
                    .collect(Collectors.toList());

            return ResponseEntity
                    .ok(ApiResponse.success("Order history fetched successfully", response));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch order history: " + e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByOrderId(@PathVariable String orderId) {

        Order order = orderRepository.findByOrderId(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Order not found with ID: " + orderId));
        }

        return ResponseEntity
                .ok(ApiResponse.success("Order fetched successfully", convertToOrderResponse(order)));
    }

    @GetMapping("/user/{userId}/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderSummary(@PathVariable Long userId) {

        if (!userRepository.existsById(userId)) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found with ID: " + userId));
        }

        Integer orderCount = orderRepository.getOrderCountByUserId(userId);
        Double totalSpent = orderRepository.getTotalSpentByUserId(userId);

        List<OrderHistoryResponse> recentOrderSummaries = orderRepository
                .findByUserIdOrderByOrderDateDesc(userId)
                .stream()
                .limit(5)
                .map(order -> new OrderHistoryResponse(
                        order.getOrderId(),
                        order.getOrderDate(),
                        order.getTotalAmount(),
                        order.getStatus(),
                        order.getItems() != null ? order.getItems().size() : 0
                ))
                .collect(Collectors.toList());

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", orderCount != null ? orderCount : 0);
        summary.put("totalSpent", totalSpent != null ? totalSpent : 0.0);
        summary.put("recentOrders", recentOrderSummaries);

        return ResponseEntity
                .ok(ApiResponse.success("Order summary fetched successfully", summary));
    }

    @PutMapping("/{orderId}/cancel")
    @Transactional
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable String orderId) {

        Order order = orderRepository.findByOrderId(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Order not found with ID: " + orderId));
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Only pending orders can be cancelled. Current status: " + order.getStatus()));
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelledOrder = orderRepository.save(order);

        return ResponseEntity
                .ok(ApiResponse.success("Order cancelled successfully", convertToOrderResponse(cancelledOrder)));
    }
}
