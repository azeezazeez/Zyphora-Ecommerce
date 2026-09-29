package com.ecommerce.backend.entity;

import lombok.Data;

@Data
public class UpdateProfile {

    private String name;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String email;
}