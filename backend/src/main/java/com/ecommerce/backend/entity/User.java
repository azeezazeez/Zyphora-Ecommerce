package com.ecommerce.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(unique = true, nullable = false, length = 255)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 30)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    /**
     * TEXT allows long profile-image URLs, including
     * Base64 and DiceBear-generated URLs.
     */
    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @Column(length = 20)
    private String role;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Automatically set timestamps when a user is created.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * Automatically update the modification timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
