package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String id;
    private String name;
    private Double price;
    private String description;
    private String category;
    private String image;
    private Double rating;
    private Integer reviews;
    private Boolean isNew;
    private Boolean inStock;
}