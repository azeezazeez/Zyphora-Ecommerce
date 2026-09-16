package com.ecommerce.backend.dto;

import com.ecommerce.backend.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String orderId;

    private LocalDateTime orderDate;

    private Double totalAmount;

    private OrderStatus status;

    /*
     * Supported payment methods:
     *
     * COD  = Cash on Delivery
     * UPI  = UPI
     * CARD = Credit / Debit Card
     */
    private String paymentMethod;

    private List<OrderItemResponse> items;
}
