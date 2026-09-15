package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.*;
import com.ecommerce.backend.entity.*;
import com.ecommerce.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    // Convert Order to AdminOrder format (matches frontend AdminOrder interface)
    private Map<String, Object> convertToAdminOrder(Order order) {
        Map<String, Object> adminOrder = new HashMap<>();
        adminOrder.put("orderId", order.getOrderId());
        adminOrder.put("userId", order.getUserId());
        adminOrder.put("orderDate", order.getOrderDate().toString());
        adminOrder.put("totalAmount", order.getTotalAmount());
        adminOrder.put("status", order.getStatus().toString());
        adminOrder.put("shippingAddress", "123 Main St"); // Update with actual address

        // Get customer info
        Optional<User> userOpt = userRepository.findById(order.getUserId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            adminOrder.put("customerName", user.getUsername());
            adminOrder.put("customerEmail", user.getEmail());
        } else {
            adminOrder.put("customerName", "Unknown");
            adminOrder.put("customerEmail", "unknown@example.com");
        }

        // Convert order items
        List<Map<String, Object>> items = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Map<String, Object> orderItem = new HashMap<>();
                orderItem.put("productId", item.getProductId());
                orderItem.put("productName", item.getProductName());
                orderItem.put("quantity", item.getQuantity());
                orderItem.put("price", item.getPrice());
                items.add(orderItem);
            }
        }
        adminOrder.put("items", items);

        return adminOrder;
    }

    // Convert User to AdminCustomer format (matches frontend AdminCustomer interface)
    private Map<String, Object> convertToAdminCustomer(User user) {
        Map<String, Object> adminCustomer = new HashMap<>();
        adminCustomer.put("id", user.getId());
        adminCustomer.put("name", user.getUsername());
        adminCustomer.put("email", user.getEmail());
        adminCustomer.put("role", user.getRole());
        adminCustomer.put("joinedDate", user.getCreatedAt() != null ? user.getCreatedAt().toString() : LocalDateTime.now().toString());

        // Get order stats for this customer
        List<Order> userOrders = orderRepository.findAll().stream()
                .filter(order -> order.getUserId() != null && order.getUserId().equals(user.getId()))
                .collect(Collectors.toList());

        int totalOrders = userOrders.size();
        double totalSpent = userOrders.stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .mapToDouble(Order::getTotalAmount)
                .sum();

        adminCustomer.put("totalOrders", totalOrders);
        adminCustomer.put("totalSpent", totalSpent);

        return adminCustomer;
    }

    // Product Management
    @PostMapping("/products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createProduct(@RequestBody Map<String, Object> request) {
        try {
            Product product = new Product();
            product.setName((String) request.get("name"));
            product.setDescription((String) request.get("description"));
            product.setPrice(Double.parseDouble(request.get("price").toString()));
            product.setCategory((String) request.get("category"));
            product.setImage((String) request.get("image"));
            product.setStock(Integer.parseInt(request.get("stock").toString()));
            product.setCreatedAt(LocalDateTime.now());

            Product savedProduct = productRepository.save(product);

            Map<String, Object> response = new HashMap<>();
            response.put("id", savedProduct.getId());
            response.put("name", savedProduct.getName());
            response.put("description", savedProduct.getDescription());
            response.put("price", savedProduct.getPrice());
            response.put("category", savedProduct.getCategory());
            response.put("image", savedProduct.getImage());
            response.put("stock", savedProduct.getStock());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Product created successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to create product: " + e.getMessage()));
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProduct(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<Product> productOpt = productRepository.findById(id);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Product not found"));
            }

            Product product = productOpt.get();
            if (request.containsKey("name")) product.setName((String) request.get("name"));
            if (request.containsKey("description")) product.setDescription((String) request.get("description"));
            if (request.containsKey("price")) product.setPrice(Double.parseDouble(request.get("price").toString()));
            if (request.containsKey("category")) product.setCategory((String) request.get("category"));
            if (request.containsKey("image")) product.setImage((String) request.get("image"));
            if (request.containsKey("stock")) product.setStock(Integer.parseInt(request.get("stock").toString()));
            product.setUpdatedAt(LocalDateTime.now());

            Product updatedProduct = productRepository.save(product);

            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedProduct.getId());
            response.put("name", updatedProduct.getName());
            response.put("description", updatedProduct.getDescription());
            response.put("price", updatedProduct.getPrice());
            response.put("category", updatedProduct.getCategory());
            response.put("image", updatedProduct.getImage());
            response.put("stock", updatedProduct.getStock());

            return ResponseEntity.ok(ApiResponse.success("Product updated successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to update product: " + e.getMessage()));
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        try {
            Optional<Product> productOpt = productRepository.findById(id);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Product not found"));
            }
            productRepository.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to delete product: " + e.getMessage()));
        }
    }

    // Order Management - Returns data in format frontend expects
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllOrders() {
        try {
            List<Order> orders = orderRepository.findAll();
            List<Map<String, Object>> adminOrders = orders.stream()
                    .sorted((a, b) -> b.getOrderDate().compareTo(a.getOrderDate()))
                    .map(this::convertToAdminOrder)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Orders fetched successfully", adminOrders));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch orders: " + e.getMessage()));
        }
    }

    @GetMapping("/orders/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderStats() {
        try {
            List<Order> orders = orderRepository.findAll();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalOrders", orders.size());
            stats.put("totalRevenue", orders.stream()
                    .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                    .mapToDouble(Order::getTotalAmount).sum());
            stats.put("pendingOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count());
            stats.put("confirmedOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.CONFIRMED).count());
            stats.put("processingOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.PROCESSING).count());
            stats.put("shippedOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.SHIPPED).count());
            stats.put("deliveredOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
            stats.put("cancelledOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count());
            stats.put("recentOrders", orders.stream()
                    .sorted((a, b) -> b.getOrderDate().compareTo(a.getOrderDate()))
                    .limit(10)
                    .map(this::convertToAdminOrder)
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(ApiResponse.success("Stats fetched successfully", stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch stats: " + e.getMessage()));
        }
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());

            Optional<Order> orderOpt = orderRepository.findByOrderId(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Order not found"));
            }

            Order order = orderOpt.get();
            order.setStatus(newStatus);
            Order updatedOrder = orderRepository.save(order);

            return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", convertToAdminOrder(updatedOrder)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update order status: " + e.getMessage()));
        }
    }

    // Customer Management - Returns data in format frontend expects
    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllCustomers() {
        try {
            List<User> users = userRepository.findAll().stream()
                    .filter(user -> user.getRole() != null && !user.getRole().equals("ADMIN"))
                    .collect(Collectors.toList());

            List<Map<String, Object>> adminCustomers = users.stream()
                    .map(this::convertToAdminCustomer)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Customers fetched successfully", adminCustomers));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch customers: " + e.getMessage()));
        }
    }
}
