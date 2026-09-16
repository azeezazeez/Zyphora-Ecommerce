package com.ecommerce.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "password_resets",
    indexes = {
        @Index(name = "idx_password_reset_email", columnList = "email", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordReset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 6)
    private String otp;

    @Column
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    @Builder.Default
    private int attemptCount = 0;
}
