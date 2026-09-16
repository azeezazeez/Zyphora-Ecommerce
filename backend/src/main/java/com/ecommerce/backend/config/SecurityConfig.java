package com.ecommerce.backend.config;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // ============================================================
    // JWT FILTER
    // ============================================================

    @Bean
    public JwtFilter jwtFilter() {
        return new JwtFilter();
    }

    // ============================================================
    // SECURITY FILTER CHAIN
    // ============================================================

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtFilter jwtFilter) throws Exception {

        http

                // ------------------------------------------------
                // CORS
                // ------------------------------------------------

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // ------------------------------------------------
                // CSRF
                // ------------------------------------------------

                .csrf(csrf ->
                        csrf.disable()
                )

                // ------------------------------------------------
                // SECURITY HEADERS
                // ------------------------------------------------

                .headers(headers ->
                        headers.frameOptions(frame ->
                                frame.disable()
                        )
                )

                // ------------------------------------------------
                // AUTHORIZATION
                // ------------------------------------------------

                .authorizeHttpRequests(auth ->
                        auth

                                // CORS preflight requests
                                .requestMatchers(
                                        org.springframework.http.HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                // Public endpoints
                                .requestMatchers(
                                        "/health",

                                        // Authentication
                                        "/api/auth/login",
                                        "/api/auth/register",
                                        "/api/auth/register/verify-otp",
                                        "/api/auth/forgot-password/**",

                                        // Products
                                        "/api/products/**",

                                        // Public APIs
                                        "/api/public/**",

                                        // Debug
                                        "/api/debug/**",

                                        // H2
                                        "/h2-console/**"
                                )
                                .permitAll()

                                // Everything else requires authentication
                                .anyRequest()
                                .authenticated()
                )

                // ------------------------------------------------
                // SESSION MANAGEMENT
                // ------------------------------------------------

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ------------------------------------------------
                // AUTHENTICATION ERRORS
                // ------------------------------------------------

                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(
                                (request, response, authException) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_UNAUTHORIZED
                                    );

                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.setCharacterEncoding(
                                            "UTF-8"
                                    );

                                    response.getWriter().write(
                                            "{\"success\":false,"
                                                    + "\"message\":\"Unauthorized — please log in\","
                                                    + "\"data\":null}"
                                    );
                                }
                        )
                )

                // ------------------------------------------------
                // JWT FILTER
                // ------------------------------------------------

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // ============================================================
    // PASSWORD ENCODER
    // ============================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ============================================================
    // CORS CONFIGURATION
    // ============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                Arrays.asList(
                        // Production frontend
                        "https://zyphora-cart.vercel.app",

                        // Previous frontend domain
                        "https://cartify-cart.vercel.app",

                        // Local development
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://localhost:8080"
                )
        );

        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS",
                        "PATCH"
                )
        );

        configuration.setAllowedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With"
                )
        );

        configuration.setExposedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type"
                )
        );

        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
