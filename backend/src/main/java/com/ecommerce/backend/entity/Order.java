package com.ecommerce.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "order_id",
            unique = true,
            nullable = false
    )
    private String orderId;

    @Column(
            name = "user_id",
            nullable = false
    )
    private Long userId;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "order_status")
    @Enumerated(EnumType.STRING)
    private OrderStatus status;


    @Column(
            name = "payment_method",
            nullable = false,
            length = 20
    )
    private String paymentMethod;


    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            fetch = FetchType.EAGER
    )
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {

        orderDate = LocalDateTime.now();

        if (orderId == null) {
            orderId =
                    "ORD-"
                            + UUID.randomUUID()
                            .toString()
                            .substring(0, 7)
                            .toUpperCase();
        }

        if (status == null) {
            status = OrderStatus.PENDING;
        }

        
        if (paymentMethod == null
                || paymentMethod.isBlank()) {

            paymentMethod = "COD";
        }
    }
}
