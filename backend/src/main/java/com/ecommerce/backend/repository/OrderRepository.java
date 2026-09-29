package com.ecommerce.backend.repository;

import com.ecommerce.backend.entity.Order;
import com.ecommerce.backend.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // =========================
    // User methods
    // =========================

    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

    Optional<Order> findByOrderId(String orderId);


    // =========================
    // Admin methods
    // =========================

    @Query("SELECT o FROM Order o ORDER BY o.orderDate DESC")
    List<Order> findAllByOrderByOrderDateDesc();

    List<Order> findByStatusOrderByOrderDateDesc(OrderStatus status);

    @Query("""
        SELECT o
        FROM Order o
        WHERE o.orderDate BETWEEN :startDate AND :endDate
        ORDER BY o.orderDate DESC
        """)
    List<Order> findOrdersBetweenDates(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );


    // =========================
    // Statistics
    // =========================

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.userId = :userId
        """)
    Integer getOrderCountByUserId(
            @Param("userId") Long userId
    );

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.userId = :userId
        """)
    Double getTotalSpentByUserId(
            @Param("userId") Long userId
    );
}
