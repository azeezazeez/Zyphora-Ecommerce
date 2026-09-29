package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemResponse {
    private Long wishlistItemId;
    private Long userId;
    private String productId;
    private String productName;
    private Double productPrice;
    private String productDescription;
    private String productImage;
    private String category;
    private Double rating;
    private Integer reviews;
    private Boolean inStock;
    private LocalDateTime addedAt;
}
