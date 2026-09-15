package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.*;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.ForgotPasswordService;
import com.ecommerce.backend.service.JwtUtil;
import com.ecommerce.backend.service.SignupOtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap; 
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private UserRepository userRepository;
    @Autowired private ForgotPasswordService forgotPasswordService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private SignupOtpService signupOtpService;

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Resolves the currently authenticated user from the security context.
     * Returns null (never throws) if the token is missing or invalid.
     */
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
            !auth.isAuthenticated() ||
            "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    /**
     * Builds the profile map returned to the client.
     * All fields come from Lombok-generated getters — no try/catch needed.
     */
    private Map<String, Object> buildProfileMap(User user) {
        Map<String, Object> map = new HashMap<>();

        map.put("id",           user.getId());
        map.put("email",        user.getEmail());
        map.put("username",     user.getUsername());
        map.put("role",         user.getRole());
        map.put("phoneNumber",  user.getPhone());
        map.put("address",      user.getAddress());
        map.put("city",         user.getCity());
        map.put("state",        user.getState());
        map.put("country",      user.getCountry());
        map.put("zipCode",      user.getZipCode());
        map.put("profileImage", user.getProfileImage());
        map.put("createdAt",
                user.getCreatedAt() != null
                        ? user.getCreatedAt().toString()
                        : null);
        map.put("updatedAt",
                user.getUpdatedAt() != null
                        ? user.getUpdatedAt().toString()
                        : null);

        return map;
    }

    /**
     * Trims a request value; returns null if blank so the DB field is cleared.
     */
    private String nullOrTrimmed(Object value) {
        if (value == null) return null;

        String s = value.toString().trim();

        return s.isEmpty() ? null : s;
    }

    /**
     * Validates a Gmail address using the same rules as AuthModal.
     *
     * Rules:
     * - Must use exactly @gmail.com
     * - Username must be 1-30 characters
     * - Username can contain only letters, numbers and periods
     * - Cannot start or end with a period
     * - Cannot contain consecutive periods
     */
    private boolean isValidGmail(String email) {
        if (email == null) return false;

        String value = email.trim();

        // Must contain exactly one @
        String[] parts = value.split("@", -1);

        if (parts.length != 2) {
            return false;
        }

        String username = parts[0];
        String domain = parts[1];

        // Domain must be exactly gmail.com
        if (!domain.equalsIgnoreCase("gmail.com")) {
            return false;
        }

        // Gmail username must be 1-30 characters
        if (username.length() < 1 || username.length() > 30) {
            return false;
        }

        // Only letters, numbers and periods are allowed
        if (!username.matches("[a-zA-Z0-9.]+")) {
            return false;
        }

        // Cannot start or end with a period
        if (username.startsWith(".") || username.endsWith(".")) {
            return false;
        }

        // Cannot contain consecutive periods
        if (username.contains("..")) {
            return false;
        }

        return true;
    }

    // ─── POST /api/auth/register ──────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String username = request.get("username");
        String password = request.get("password");
        String confirmPassword = request.get("confirmPassword");

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        if (!isValidGmail(email))
            return ResponseEntity.badRequest().body(ApiResponse.error("Please enter a valid Gmail address, for example: example@gmail.com"));
        if (username == null || !username.trim().matches("[A-Za-z0-9._-]{3,30}"))
            return ResponseEntity.badRequest().body(ApiResponse.error("Username must be 3-30 characters and contain only letters, numbers, dots, underscores or hyphens"));
        if (password == null || !password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$"))
            return ResponseEntity.badRequest().body(ApiResponse.error("Password must be 8-72 characters and include uppercase, lowercase, number and special character"));
        if (confirmPassword != null && !password.equals(confirmPassword))
            return ResponseEntity.badRequest().body(ApiResponse.error("Passwords do not match"));

        try {
            signupOtpService.requestOtp(email, username, password);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success("Verification OTP sent to your email", Map.of("email", email.trim().toLowerCase(), "expiresInSeconds", 300)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyRegistrationOtp(
            @RequestBody VerifyOtpRequest request) {

        if (request.getEmail() == null || !isValidGmail(request.getEmail()))
            return ResponseEntity.badRequest().body(ApiResponse.error("Please enter a valid Gmail address"));
        if (request.getOtp() == null || !request.getOtp().matches("\\d{6}"))
            return ResponseEntity.badRequest().body(ApiResponse.error("OTP must be exactly 6 digits"));

        try {
            User saved = signupOtpService.verifyOtp(request.getEmail(), request.getOtp());
            String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole());
            Map<String, Object> data = new HashMap<>();
            data.put("id", saved.getId());
            data.put("email", saved.getEmail());
            data.put("username", saved.getUsername());
            data.put("role", saved.getRole());
            data.put("token", token);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Account verified and created successfully", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @RequestBody Map<String, String> request) {

        String email    = request.get("email");
        String password = request.get("password");

        if (email == null || password == null)
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "Email and password are required"));

        Optional<User> userOpt =
                userRepository.findByEmail(
                        email.trim().toLowerCase()
                );

        // Same error message whether the email is missing or the password is wrong (security)
        if (userOpt.isEmpty() ||
            !passwordEncoder.matches(
                    password,
                    userOpt.get().getPassword())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                            "Invalid email or password"));
        }

        User user = userOpt.get();

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole()
        );

        Map<String, Object> data = new HashMap<>();

        data.put("id",       user.getId());
        data.put("email",    user.getEmail());
        data.put("username", user.getUsername());
        data.put("role",     user.getRole());
        data.put("token",    token);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Login successful",
                        data
                )
        );
    }

    // ─── POST /api/auth/forgot-password/generate-otp ─────────────────────────

    @PostMapping("/forgot-password/generate-otp")
    public ResponseEntity<ApiResponse<Void>> generateOtp(
            @RequestBody ForgotPasswordRequest request) {

        boolean sent =
                forgotPasswordService.generateAndSendOtp(
                        request.getEmail()
                );

        if (!sent)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(
                            "No account found with that email"));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "OTP sent successfully",
                        null
                )
        );
    }

    // ─── POST /api/auth/forgot-password/reset ────────────────────────────────

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        boolean reset =
                forgotPasswordService.resetPassword(
                        request.getEmail(),
                        request.getOtp(),
                        request.getNewPassword()
                );

        if (!reset)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(
                            "Invalid or expired OTP"));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Password reset successful",
                        null
                )
        );
    }

    // ─── GET /api/auth/profile ────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile() {

        User user = getAuthenticatedUser();

        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                            "Unauthorized — please log in"));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Profile fetched successfully",
                        buildProfileMap(user)
                )
        );
    }

    // ─── PUT /api/auth/profile ────────────────────────────────────────────────

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestBody Map<String, Object> request) {

        User user = getAuthenticatedUser();

        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                            "Unauthorized — please log in"));

        // username: required, cannot be blank
        if (request.containsKey("username")) {

            String newUsername =
                    nullOrTrimmed(request.get("username"));

            if (newUsername == null)
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "Username cannot be blank"));

            // Only check uniqueness if the value actually changed
            if (!newUsername.equals(user.getUsername())
                    && userRepository.existsByUsername(newUsername)) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error(
                                "Username already taken"));
            }

            user.setUsername(newUsername);
        }

        // All other fields accept null so the client can clear them
        if (request.containsKey("phoneNumber"))
            user.setPhone(
                    nullOrTrimmed(request.get("phoneNumber"))
            );

        if (request.containsKey("address"))
            user.setAddress(
                    nullOrTrimmed(request.get("address"))
            );

        if (request.containsKey("city"))
            user.setCity(
                    nullOrTrimmed(request.get("city"))
            );

        if (request.containsKey("state"))
            user.setState(
                    nullOrTrimmed(request.get("state"))
            );

        if (request.containsKey("country"))
            user.setCountry(
                    nullOrTrimmed(request.get("country"))
            );

        if (request.containsKey("zipCode"))
            user.setZipCode(
                    nullOrTrimmed(request.get("zipCode"))
            );

        if (request.containsKey("profileImage"))
            user.setProfileImage(
                    nullOrTrimmed(request.get("profileImage"))
            );

        // @PreUpdate in User entity updates updatedAt automatically on save
        User updated = userRepository.save(user);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Profile updated successfully",
                        buildProfileMap(updated)
                )
        );
    }

    // ─── PUT /api/auth/profile/change-password ────────────────────────────────

    @PutMapping("/profile/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> request) {

        User user = getAuthenticatedUser();

        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                            "Unauthorized — please log in"));

        String currentPassword = request.get("currentPassword");
        String newPassword     = request.get("newPassword");

        if (currentPassword == null || newPassword == null)
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "Both currentPassword and newPassword are required"));

        if (newPassword.length() < 6)
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "New password must be at least 6 characters"));

        if (!passwordEncoder.matches(
                currentPassword,
                user.getPassword())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                            "Current password is incorrect"));
        }

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Password changed successfully",
                        null
                )
        );
    }

    // ─── DELETE /api/auth/profile ─────────────────────────────────────────────

    @DeleteMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> deleteAccount() {

        User user = getAuthenticatedUser();

        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                            "Unauthorized — please log in"));

        userRepository.delete(user);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Account permanently deleted",
                        null
                )
        );
    }
}
