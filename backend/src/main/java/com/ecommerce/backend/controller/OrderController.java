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

    // ============================================================
    // REPOSITORIES & SERVICES
    // ============================================================

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


    // ============================================================
    // CONVERT ORDER ENTITY -> ORDER RESPONSE
    // ============================================================

    private OrderResponse convertToOrderResponse(Order order) {

        List<OrderItemResponse> itemResponses =
                new ArrayList<>();

        if (order.getItems() != null) {

            itemResponses =
                    order.getItems()
                            .stream()
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


    // ============================================================
    // PLACE ORDER
    // POST /api/orders/place/{userId}
    // ============================================================

    @PostMapping("/place/{userId}")
    @Transactional
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> request) {

        try {

            // ====================================================
            // 1. FIND USER
            // ====================================================

            User user =
                    userRepository
                            .findById(userId)
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                                ApiResponse.error(
                                        "User not found with ID: "
                                                + userId
                                )
                        );
            }


            // ====================================================
            // 2. GET USER CART
            // ====================================================

            List<CartItem> cartItems =
                    cartRepository.findByUserId(userId);

            if (cartItems == null || cartItems.isEmpty()) {

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(
                                ApiResponse.error(
                                        "Cannot place order with empty cart"
                                )
                        );
            }


            // ====================================================
            // 3. VALIDATE PAYMENT METHOD
            // ====================================================

            String paymentMethod = "COD";

            if (request != null
                    && request.get("paymentMethod") != null
                    && !request.get("paymentMethod").isBlank()) {

                paymentMethod =
                        request.get("paymentMethod")
                                .trim()
                                .toUpperCase();
            }

            if (!paymentMethod.equals("COD")
                    && !paymentMethod.equals("UPI")
                    && !paymentMethod.equals("CARD")) {

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(
                                ApiResponse.error(
                                        "Invalid payment method. "
                                                + "Allowed methods: COD, UPI, CARD"
                                )
                        );
            }


            // ====================================================
            // 4. CREATE NEW ORDER
            // ====================================================

            Order order = new Order();

            order.setUserId(userId);

            order.setStatus(
                    OrderStatus.PENDING
            );

            /*
             * Save only the selected payment method.
             *
             * IMPORTANT:
             * Card number, CVV, expiry date, UPI credentials,
             * or other sensitive payment information are NOT
             * stored in the Zyphora database.
             */
            order.setPaymentMethod(paymentMethod);


            // ====================================================
            // 5. CREATE ORDER ITEMS
            // ====================================================

            Double totalAmount = 0.0;

            List<OrderItem> orderItems =
                    new ArrayList<>();


            for (CartItem cartItem : cartItems) {

                // ------------------------------------------------
                // Validate product ID
                // ------------------------------------------------

                Long productIdLong;

                try {

                    productIdLong =
                            Long.parseLong(
                                    cartItem.getProductId()
                            );

                } catch (NumberFormatException e) {

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(
                                    ApiResponse.error(
                                            "Invalid product ID: "
                                                    + cartItem.getProductId()
                                    )
                            );
                }


                // ------------------------------------------------
                // Find product
                // ------------------------------------------------

                Product product =
                        productRepository
                                .findById(productIdLong)
                                .orElse(null);

                if (product == null) {

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(
                                    ApiResponse.error(
                                            "Product not found: "
                                                    + cartItem.getProductId()
                                    )
                            );
                }


                // ------------------------------------------------
                // Validate quantity
                // ------------------------------------------------

                if (cartItem.getQuantity() == null
                        || cartItem.getQuantity() <= 0) {

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(
                                    ApiResponse.error(
                                            "Invalid quantity for product: "
                                                    + product.getName()
                                    )
                            );
                }


                // ------------------------------------------------
                // Stock validation
                // ------------------------------------------------

                if (product.getStock() != null
                        && product.getStock()
                        < cartItem.getQuantity()) {

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(
                                    ApiResponse.error(
                                            "Insufficient stock for: "
                                                    + product.getName()
                                                    + ". Available: "
                                                    + product.getStock()
                                    )
                            );
                }


                // ------------------------------------------------
                // Calculate subtotal
                // ------------------------------------------------

                double subtotal =
                        product.getPrice()
                                * cartItem.getQuantity();


                // ------------------------------------------------
                // Create OrderItem
                // ------------------------------------------------

                OrderItem orderItem =
                        new OrderItem();

                orderItem.setOrder(order);

                orderItem.setProductId(
                        cartItem.getProductId()
                );

                orderItem.setProductName(
                        product.getName()
                );

                orderItem.setPrice(
                        product.getPrice()
                );

                orderItem.setQuantity(
                        cartItem.getQuantity()
                );

                orderItem.setSubtotal(
                        subtotal
                );


                // ------------------------------------------------
                // Add item
                // ------------------------------------------------

                orderItems.add(orderItem);

                totalAmount += subtotal;
            }


            // ====================================================
            // 6. SET ORDER TOTAL & ITEMS
            // ====================================================

            order.setTotalAmount(
                    totalAmount
            );

            order.setItems(
                    orderItems
            );


            // ====================================================
            // 7. SAVE ORDER
            // ====================================================

            Order savedOrder =
                    orderRepository.save(order);


            // ====================================================
            // 8. UPDATE PRODUCT STOCK
            // ====================================================

            for (CartItem cartItem : cartItems) {

                try {

                    Long productIdLong =
                            Long.parseLong(
                                    cartItem.getProductId()
                            );

                    productRepository
                            .findById(productIdLong)
                            .ifPresent(product -> {

                                if (product.getStock() != null) {

                                    int updatedStock =
                                            Math.max(
                                                    product.getStock()
                                                            - cartItem.getQuantity(),
                                                    0
                                            );

                                    product.setStock(
                                            updatedStock
                                    );

                                    productRepository.save(
                                            product
                                    );
                                }
                            });

                } catch (NumberFormatException ignored) {

                    /*
                     * Product ID was already validated above.
                     * Nothing needs to be done here.
                     */
                }
            }


            // ====================================================
            // 9. CLEAR USER CART
            // ====================================================

            cartRepository.deleteAllByUserId(
                    userId
            );


            // ====================================================
            // 10. SEND ORDER CONFIRMATION EMAIL
            // ====================================================

            /*
             * The order has already been saved and the cart has
             * already been cleared.
             *
             * If Brevo/email fails, the order remains successful.
             */

            try {

                emailService.sendOrderConfirmation(
                        user.getEmail(),
                        user.getUsername(),
                        savedOrder
                );

                System.out.println(
                        "Order confirmation email sent successfully to: "
                                + user.getEmail()
                );

            } catch (Exception emailException) {

                System.err.println(
                        "Order was placed successfully, but "
                                + "the confirmation email could not be sent."
                );

                System.err.println(
                        "Email error: "
                                + emailException.getMessage()
                );

                emailException.printStackTrace();
            }


            // ====================================================
            // 11. RETURN SUCCESS RESPONSE
            // ====================================================

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            ApiResponse.success(
                                    "Order placed successfully",
                                    convertToOrderResponse(
                                            savedOrder
                                    )
                            )
                    );


        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            ApiResponse.error(
                                    "Failed to place order: "
                                            + e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // GET USER ORDER HISTORY
    // GET /api/orders/user/{userId}
    // ============================================================

    @GetMapping("/user/{userId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OrderResponse>>>
    getOrderHistory(
            @PathVariable Long userId) {

        try {

            if (!userRepository.existsById(userId)) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                                ApiResponse.error(
                                        "User not found with ID: "
                                                + userId
                                )
                        );
            }

            List<Order> orders =
                    orderRepository
                            .findByUserIdOrderByOrderDateDesc(
                                    userId
                            );

            List<OrderResponse> response =
                    orders.stream()
                            .map(this::convertToOrderResponse)
                            .collect(Collectors.toList());

            return ResponseEntity
                    .ok(
                            ApiResponse.success(
                                    "Order history fetched successfully",
                                    response
                            )
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            ApiResponse.error(
                                    "Failed to fetch order history: "
                                            + e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // GET ORDER BY ORDER ID
    // GET /api/orders/{orderId}
    // ============================================================

    @GetMapping("/{orderId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<OrderResponse>>
    getOrderByOrderId(
            @PathVariable String orderId) {

        Order order =
                orderRepository
                        .findByOrderId(orderId)
                        .orElse(null);

        if (order == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            ApiResponse.error(
                                    "Order not found with ID: "
                                            + orderId
                            )
                    );
        }

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Order fetched successfully",
                                convertToOrderResponse(order)
                        )
                );
    }


    // ============================================================
    // GET USER ORDER SUMMARY
    // GET /api/orders/user/{userId}/summary
    // ============================================================

    @GetMapping("/user/{userId}/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>>
    getOrderSummary(
            @PathVariable Long userId) {

        if (!userRepository.existsById(userId)) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            ApiResponse.error(
                                    "User not found with ID: "
                                            + userId
                            )
                    );
        }

        Integer orderCount =
                orderRepository.getOrderCountByUserId(
                        userId
                );

        Double totalSpent =
                orderRepository.getTotalSpentByUserId(
                        userId
                );

        List<OrderHistoryResponse> recentOrderSummaries =
                orderRepository
                        .findByUserIdOrderByOrderDateDesc(userId)
                        .stream()
                        .limit(5)
                        .map(order ->
                                new OrderHistoryResponse(
                                        order.getOrderId(),
                                        order.getOrderDate(),
                                        order.getTotalAmount(),
                                        order.getStatus(),
                                        order.getItems() != null
                                                ? order.getItems().size()
                                                : 0
                                )
                        )
                        .collect(Collectors.toList());

        Map<String, Object> summary =
                new HashMap<>();

        summary.put(
                "totalOrders",
                orderCount != null
                        ? orderCount
                        : 0
        );

        summary.put(
                "totalSpent",
                totalSpent != null
                        ? totalSpent
                        : 0.0
        );

        summary.put(
                "recentOrders",
                recentOrderSummaries
        );

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Order summary fetched successfully",
                                summary
                        )
                );
    }


    // ============================================================
    // CANCEL ORDER
    // PUT /api/orders/{orderId}/cancel
    // ============================================================

    @PutMapping("/{orderId}/cancel")
    @Transactional
    public ResponseEntity<ApiResponse<OrderResponse>>
    cancelOrder(
            @PathVariable String orderId) {

        Order order =
                orderRepository
                        .findByOrderId(orderId)
                        .orElse(null);

        if (order == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            ApiResponse.error(
                                    "Order not found with ID: "
                                            + orderId
                            )
                    );
        }

        if (order.getStatus() != OrderStatus.PENDING) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            ApiResponse.error(
                                    "Only pending orders can be "
                                            + "cancelled. Current status: "
                                            + order.getStatus()
                            )
                    );
        }

        order.setStatus(
                OrderStatus.CANCELLED
        );

        Order cancelledOrder =
                orderRepository.save(order);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Order cancelled successfully",
                                convertToOrderResponse(
                                        cancelledOrder
                                )
                        )
                );
    }
}
