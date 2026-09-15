package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.entity.Product;
import com.ecommerce.backend.entity.WishlistItem;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wishlist")
@Transactional
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWishlist(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
        }

        List<WishlistItem> wishlistItems = wishlistRepository.findByUserId(userId);

        List<Map<String, Object>> items = new ArrayList<>();

        for (WishlistItem item : wishlistItems) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isPresent()) {
                Product product = productOpt.get();
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("wishlistItemId", item.getId());
                itemMap.put("userId", item.getUserId());
                itemMap.put("productId", String.valueOf(item.getProductId()));
                itemMap.put("id", product.getId());
                itemMap.put("name", product.getName());
                itemMap.put("productName", product.getName());
                itemMap.put("price", product.getPrice());
                itemMap.put("productPrice", product.getPrice());
                itemMap.put("image", product.getImage());
                itemMap.put("productImage", product.getImage());
                itemMap.put("description", product.getDescription());
                itemMap.put("category", product.getCategory());
                itemMap.put("stock", product.getStock());
                itemMap.put("inStock", product.getStock() != null && product.getStock() > 0);
                itemMap.put("addedAt", item.getAddedAt());

                items.add(itemMap);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("items", items);
        response.put("totalItems", items.size());

        return ResponseEntity.ok(ApiResponse.success("Wishlist fetched", response));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addToWishlist(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String productIdStr = request.get("productId").toString();

            Long productIdLong;
            try {
                productIdLong = Long.parseLong(productIdStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid product ID format"));
            }

            if (!userRepository.existsById(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            Optional<Product> productOpt = productRepository.findById(productIdLong);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Product not found"));
            }

            // Check if already in wishlist
            Optional<WishlistItem> existingItem = wishlistRepository.findByUserIdAndProductId(userId, productIdLong);
            if (existingItem.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Product already in wishlist"));
            }

            WishlistItem newItem = new WishlistItem();
            newItem.setUserId(userId);
            newItem.setProductId(productIdLong);
            newItem.setAddedAt(LocalDateTime.now());
            wishlistRepository.save(newItem);

            return getWishlist(userId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to add to wishlist: " + e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{userId}/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeFromWishlist(
            @PathVariable Long userId,
            @PathVariable String productId) {
        try {
            System.out.println("=== REMOVE FROM WISHLIST ===");
            System.out.println("User ID: " + userId);
            System.out.println("Product ID: " + productId);

            Long productIdLong;
            try {
                productIdLong = Long.parseLong(productId);
            } catch (NumberFormatException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid product ID format"));
            }

            // Check if item exists
            Optional<WishlistItem> existingItem = wishlistRepository.findByUserIdAndProductId(userId, productIdLong);
            if (existingItem.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Product not in wishlist"));
            }

            // Delete the item
            wishlistRepository.deleteByUserIdAndProductId(userId, productIdLong);

            System.out.println("Successfully removed from wishlist");

            return getWishlist(userId);
        } catch (Exception e) {
            System.err.println("Error removing from wishlist: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to remove from wishlist: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> checkInWishlist(
            @PathVariable Long userId,
            @PathVariable String productId) {

        Long productIdLong = Long.parseLong(productId);
        boolean exists = wishlistRepository.existsByUserIdAndProductId(userId, productIdLong);
        return ResponseEntity.ok(ApiResponse.success("Check completed", exists));
    }
}
