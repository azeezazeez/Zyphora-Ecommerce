package com.ecommerce.backend.dto;

import com.ecommerce.backend.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderHistoryResponse {
    private String orderId;
    private LocalDateTime orderDate;
    private Double totalAmount;
    private OrderStatus status;
    private int itemCount;
}