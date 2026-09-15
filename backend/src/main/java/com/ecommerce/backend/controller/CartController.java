package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.entity.CartItem;
import com.ecommerce.backend.entity.Product;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCart(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
        }

        List<CartItem> cartItems = cartRepository.findByUserId(userId);

        List<Map<String, Object>> items = new ArrayList<>();
        double totalAmount = 0;
        int totalItems = 0;

        for (CartItem item : cartItems) {
            // Convert productId String to Long for database lookup
            Long productIdLong;
            try {
                productIdLong = Long.parseLong(item.getProductId());
            } catch (NumberFormatException e) {
                continue; // Skip if productId is not a valid number
            }

            Optional<Product> productOpt = productRepository.findById(productIdLong);
            if (productOpt.isPresent()) {
                Product product = productOpt.get();
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("cartItemId", item.getId());
                itemMap.put("userId", item.getUserId());
                itemMap.put("productId", item.getProductId());
                itemMap.put("id", product.getId());
                itemMap.put("name", product.getName());
                itemMap.put("productName", product.getName());
                itemMap.put("price", product.getPrice());
                itemMap.put("productPrice", product.getPrice());
                itemMap.put("image", product.getImage());
                itemMap.put("productImage", product.getImage());
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("subtotal", product.getPrice() * item.getQuantity());

                items.add(itemMap);
                totalAmount += product.getPrice() * item.getQuantity();
                totalItems += item.getQuantity();
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("items", items);
        response.put("totalItems", totalItems);
        response.put("totalAmount", totalAmount);

        return ResponseEntity.ok(ApiResponse.success("Cart fetched", response));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addToCart(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String productIdStr = request.get("productId").toString();
            Integer quantity = Integer.valueOf(request.get("quantity").toString());

            if (!userRepository.existsById(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            // Convert productId String to Long
            Long productIdLong;
            try {
                productIdLong = Long.parseLong(productIdStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid product ID format"));
            }

            Optional<Product> productOpt = productRepository.findById(productIdLong);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Product not found"));
            }

            Optional<CartItem> existingItem = cartRepository.findByUserIdAndProductId(userId, productIdStr);

            if (existingItem.isPresent()) {
                CartItem item = existingItem.get();
                item.setQuantity(item.getQuantity() + quantity);
                cartRepository.save(item);
            } else {
                CartItem newItem = new CartItem();
                newItem.setUserId(userId);
                newItem.setProductId(productIdStr);
                newItem.setQuantity(quantity);
                cartRepository.save(newItem);
            }

            return getCart(userId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to add to cart: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCartQuantity(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String productIdStr = request.get("productId").toString();
            Integer quantity = Integer.valueOf(request.get("quantity").toString());

            Optional<CartItem> existingItem = cartRepository.findByUserIdAndProductId(userId, productIdStr);

            if (existingItem.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Item not found in cart"));
            }

            // Verify product exists
            Long productIdLong;
            try {
                productIdLong = Long.parseLong(productIdStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid product ID format"));
            }

            Optional<Product> productOpt = productRepository.findById(productIdLong);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Product not found"));
            }

            CartItem item = existingItem.get();
            item.setQuantity(quantity);
            cartRepository.save(item);

            return getCart(userId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update cart: " + e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{userId}/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeFromCart(
            @PathVariable Long userId,
            @PathVariable String productId) {

        cartRepository.deleteByUserIdAndProductId(userId, productId);
        return getCart(userId);
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearCart(@PathVariable Long userId) {
        cartRepository.deleteAllByUserId(userId);
        return getCart(userId);
    }
}
