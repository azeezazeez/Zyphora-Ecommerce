package com.ecommerce.backend.config;

import com.ecommerce.backend.service.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    // ============================================================
    // FILTER EXCLUSIONS
    // ============================================================

    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request) {

        String path = request.getServletPath();
        String method = request.getMethod();

        // Always skip CORS preflight requests.
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Public authentication endpoints.
        if (path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/register/verify-otp")
                || path.startsWith("/api/auth/forgot-password")) {
            return true;
        }

        // Public product endpoints.
        if (path.startsWith("/api/products")) {
            return true;
        }

        // Other public endpoints.
        if (path.startsWith("/api/public")
                || path.startsWith("/api/debug")
                || path.startsWith("/h2-console")
                || path.startsWith("/health")) {
            return true;
        }

        return false;
    }

    // ============================================================
    // JWT PROCESSING
    // ============================================================

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        /*
         * If there is no Authorization header, do not reject
         * the request here.
         *
         * Spring Security will later decide whether the
         * requested endpoint requires authentication.
         */
        if (authHeader == null
                || authHeader.isBlank()) {

            filterChain.doFilter(request, response);
            return;
        }

        /*
         * An Authorization header exists, but it is not
         * using the expected Bearer scheme.
         */
        if (!authHeader.startsWith("Bearer ")) {

            SecurityContextHolder
                    .clearContext();

            sendError(
                    response,
                    "Missing or invalid Authorization header"
            );

            return;
        }

        String jwt =
                authHeader.substring(7).trim();

        if (jwt.isEmpty()) {

            SecurityContextHolder
                    .clearContext();

            sendError(
                    response,
                    "Missing or invalid Authorization header"
            );

            return;
        }

        try {

            String userEmail =
                    jwtUtil.extractEmail(jwt);

            if (userEmail == null
                    || userEmail.isBlank()) {

                SecurityContextHolder
                        .clearContext();

                sendError(
                        response,
                        "Invalid token — no subject found"
                );

                return;
            }

            /*
             * Don't overwrite an authentication that has
             * already been established.
             */
            if (SecurityContextHolder
                    .getContext()
                    .getAuthentication() == null) {

                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(userEmail);

                if (userDetails == null) {

                    SecurityContextHolder
                            .clearContext();

                    sendError(
                            response,
                            "User not found"
                    );

                    return;
                }

                boolean valid =
                        jwtUtil.validateToken(
                                jwt,
                                userEmail
                        );

                if (!valid) {

                    SecurityContextHolder
                            .clearContext();

                    sendError(
                            response,
                            "Token validation failed"
                    );

                    return;
                }

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authToken);
            }

        } catch (ExpiredJwtException e) {

            SecurityContextHolder
                    .clearContext();

            sendError(
                    response,
                    "Token expired"
            );

            return;

        } catch (MalformedJwtException
                 | SignatureException e) {

            SecurityContextHolder
                    .clearContext();

            sendError(
                    response,
                    "Invalid token"
            );

            return;

        } catch (Exception e) {

            SecurityContextHolder
                    .clearContext();

            System.err.println(
                    "JWT authentication failed: "
                            + e.getClass().getSimpleName()
                            + " — "
                            + e.getMessage()
            );

            sendError(
                    response,
                    "Authentication failed"
            );

            return;
        }

        filterChain.doFilter(
                request,
                response
        );
    }

    // ============================================================
    // ERROR RESPONSE
    // ============================================================

    private void sendError(
            HttpServletResponse response,
            String message)
            throws IOException {

        if (response.isCommitted()) {
            return;
        }

        response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
        );

        response.setContentType(
                "application/json"
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        String safeMessage =
                message == null
                        ? "Authentication failed"
                        : message
                                .replace("\\", "\\\\")
                                .replace("\"", "\\\"");

        response.getWriter().write(
                "{"
                        + "\"success\":false,"
                        + "\"message\":\""
                        + safeMessage
                        + "\","
                        + "\"data\":null"
                        + "}"
        );
    }
}
