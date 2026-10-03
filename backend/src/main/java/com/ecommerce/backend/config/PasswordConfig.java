package com.ecommerce.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new Argon2PasswordEncoder(
                16,       // Salt length
                32,       // Hash length
                1,        // Parallelism
                65536,    // Memory in KB = 64 MB
                3         // Iterations
        );
    }
}
