package com.ecommerce.backend.dto.admin;

import com.ecommerce.backend.entity.Order;
import com.ecommerce.backend.entity.OrderItem;
import com.ecommerce.backend.entity.OrderStatus;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderDTO {
    private String orderId;
    private LocalDateTime orderDate;
    private Double totalAmount;
    private OrderStatus status;
    private List<AdminOrderItemDTO> items;
    private AdminCustomerInfoDTO customer;

    public static AdminOrderDTO fromOrder(Order order, UserRepository userRepository) {
        AdminOrderDTO dto = new AdminOrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setOrderDate(order.getOrderDate());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());

        // Convert items
        dto.setItems(order.getItems().stream()
                .map(AdminOrderItemDTO::fromOrderItem)
                .collect(Collectors.toList()));

        // Get customer info
        User user = userRepository.findById(order.getUserId()).orElse(null);
        if (user != null) {
            dto.setCustomer(AdminCustomerInfoDTO.fromUser(user));
        }

        return dto;
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class AdminOrderItemDTO {
    private String productId;
    private String productName;
    private Double price;
    private Integer quantity;
    private Double total;

    public static AdminOrderItemDTO fromOrderItem(OrderItem item) {
        return new AdminOrderItemDTO(
                item.getProductId(),
                item.getProductName(),
                item.getPrice(),
                item.getQuantity(),
                item.getSubtotal()
        );
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class AdminCustomerInfoDTO {
    private Long id;
    private String name;
    private String email;

    public static AdminCustomerInfoDTO fromUser(User user) {
        return new AdminCustomerInfoDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail()
        );
    }
}