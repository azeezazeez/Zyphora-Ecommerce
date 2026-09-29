package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private Long cartItemId;
    private Long userId;
    private String productId;
    private String productName;
    private Double productPrice;
    private String productImage;
    private Integer quantity;
    private Double subtotal;
}