package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.EmailOtpRequest;
import com.ecommerce.backend.dto.ForgotPasswordRequest;
import com.ecommerce.backend.dto.ResetPasswordRequest;
import com.ecommerce.backend.dto.VerifyOtpRequest;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.EmailLoginOtpService;
import com.ecommerce.backend.service.ForgotPasswordService;
import com.ecommerce.backend.service.GoogleAuthService;
import com.ecommerce.backend.service.JwtUtil;
import com.ecommerce.backend.service.SignupOtpService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // ============================================================
    // DEPENDENCIES
    // ============================================================

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SignupOtpService signupOtpService;

    @Autowired
    private EmailLoginOtpService emailLoginOtpService;

    @Autowired
    private GoogleAuthService googleAuthService;


    // ============================================================
    // GOOGLE OAUTH CONFIGURATION
    // ============================================================

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.redirect.uri}")
    private String googleRedirectUri;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;


    // ============================================================
    // INTERNAL HELPERS
    // ============================================================

    private String getFrontendUrl() {
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return "http://localhost:3000";
        }

        return frontendUrl.trim().replaceAll("/+$", "");
    }

    private User getAuthenticatedUser() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {

            return null;
        }

        return userRepository
                .findByEmail(auth.getName())
                .orElse(null);
    }


    private Map<String, Object> buildProfileMap(User user) {

        Map<String, Object> map =
                new HashMap<>();

        map.put("id", user.getId());
        map.put("email", user.getEmail());
        map.put("username", user.getUsername());
        map.put("role", user.getRole());

        map.put("phoneNumber", user.getPhone());
        map.put("address", user.getAddress());
        map.put("city", user.getCity());
        map.put("state", user.getState());
        map.put("country", user.getCountry());
        map.put("zipCode", user.getZipCode());

        map.put(
                "createdAt",
                user.getCreatedAt() != null
                        ? user.getCreatedAt().toString()
                        : null
        );

        map.put(
                "updatedAt",
                user.getUpdatedAt() != null
                        ? user.getUpdatedAt().toString()
                        : null
        );

        return map;
    }


    private String nullOrTrimmed(Object value) {

        if (value == null) {
            return null;
        }

        String valueString =
                value.toString().trim();

        return valueString.isEmpty()
                ? null
                : valueString;
    }


    private boolean isValidGmail(String email) {

        if (email == null) {
            return false;
        }

        String value = email.trim();

        String[] parts =
                value.split("@", -1);

        if (parts.length != 2) {
            return false;
        }

        String username = parts[0];
        String domain = parts[1];

        if (!domain.equalsIgnoreCase("gmail.com")) {
            return false;
        }

        if (username.length() < 1
                || username.length() > 30) {

            return false;
        }

        if (!username.matches("[a-zA-Z0-9.]+")) {
            return false;
        }

        if (username.startsWith(".")
                || username.endsWith(".")) {

            return false;
        }

        if (username.contains("..")) {
            return false;
        }

        return true;
    }


    // ============================================================
    // REGISTER
    // POST /api/auth/register
    // ============================================================

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @RequestBody Map<String, String> request) {

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Registration request is required"
                            )
                    );
        }

        String email =
                request.get("email");

        String username =
                request.get("username");

        String password =
                request.get("password");

        String confirmPassword =
                request.get("confirmPassword");


        // ========================================================
        // EMAIL VALIDATION
        // ========================================================

        if (email == null || email.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Email is required"
                            )
                    );
        }

        email =
                email.trim()
                        .toLowerCase();

        if (!isValidGmail(email)) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Please enter a valid Gmail address, "
                                            + "for example: example@gmail.com"
                            )
                    );
        }


        // ========================================================
        // USERNAME VALIDATION
        // ========================================================

        if (username == null
                || !username.trim()
                .matches("[A-Za-z0-9._-]{3,30}")) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Username must be 3-30 characters "
                                            + "and contain only letters, "
                                            + "numbers, dots, underscores "
                                            + "or hyphens"
                            )
                    );
        }

        username =
                username.trim();


        // ========================================================
        // PASSWORD VALIDATION
        // ========================================================

        if (password == null
                || !password.matches(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
                        + "(?=.*[^A-Za-z0-9]).{8,72}$")) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Password must be 8-72 characters "
                                            + "and include uppercase, "
                                            + "lowercase, number and "
                                            + "special character"
                            )
                    );
        }


        // ========================================================
        // CONFIRM PASSWORD
        // ========================================================

        if (confirmPassword != null
                && !password.equals(confirmPassword)) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Passwords do not match"
                            )
                    );
        }


        // ========================================================
        // REQUEST SIGNUP OTP
        // ========================================================

        try {

            signupOtpService.requestOtp(
                    email,
                    username,
                    password
            );

            Map<String, Object> data =
                    new HashMap<>();

            data.put(
                    "email",
                    email
            );

            data.put(
                    "expiresInSeconds",
                    300
            );

            return ResponseEntity
                    .status(HttpStatus.ACCEPTED)
                    .body(
                            ApiResponse.success(
                                    "Verification OTP sent to your email",
                                    data
                            )
                    );

        } catch (IllegalArgumentException e) {

            System.err.println(
                    "Zyphora registration rejected: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );

        } catch (IllegalStateException e) {

            String message =
                    e.getMessage();

            if (message != null
                    && message.startsWith("Please wait")) {

                return ResponseEntity
                        .status(
                                HttpStatus.TOO_MANY_REQUESTS
                        )
                        .body(
                                ApiResponse.error(
                                        message
                                )
                        );
            }


            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "ZYPHORA REGISTRATION EMAIL FAILURE"
            );

            System.err.println(
                    "Error type: "
                            + e.getClass().getName()
            );

            System.err.println(
                    "Error message: "
                            + e.getMessage()
            );

            if (e.getCause() != null) {

                System.err.println(
                        "Cause type: "
                                + e.getCause()
                                .getClass()
                                .getName()
                );

                System.err.println(
                        "Cause message: "
                                + e.getCause()
                                .getMessage()
                );
            }

            System.err.println(
                    "================================================"
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(
                            ApiResponse.error(
                                    "Unable to send OTP email. "
                                            + "Please try again later."
                            )
                    );

        } catch (RuntimeException e) {

            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "ZYPHORA REGISTRATION UNEXPECTED ERROR"
            );

            System.err.println(
                    "Error type: "
                            + e.getClass().getName()
            );

            System.err.println(
                    "Error message: "
                            + e.getMessage()
            );

            if (e.getCause() != null) {

                System.err.println(
                        "Cause type: "
                                + e.getCause()
                                .getClass()
                                .getName()
                );

                System.err.println(
                        "Cause message: "
                                + e.getCause()
                                .getMessage()
                );
            }

            System.err.println(
                    "================================================"
            );

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            ApiResponse.error(
                                    "Registration could not be completed. "
                                            + "Please try again later."
                            )
                    );
        }
    }


    // ============================================================
    // VERIFY REGISTRATION OTP
    // POST /api/auth/register/verify-otp
    // ============================================================

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
    verifyRegistrationOtp(
            @RequestBody VerifyOtpRequest request) {

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Verification request is required"
                            )
                    );
        }

        if (request.getEmail() == null
                || !isValidGmail(request.getEmail())) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Please enter a valid Gmail address"
                            )
                    );
        }

        if (request.getOtp() == null
                || !request.getOtp().matches("\\d{6}")) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "OTP must be exactly 6 digits"
                            )
                    );
        }

        try {

            User saved =
                    signupOtpService.verifyOtp(
                            request.getEmail()
                                    .trim()
                                    .toLowerCase(),
                            request.getOtp().trim()
                    );

            String token =
                    jwtUtil.generateToken(
                            saved.getEmail(),
                            saved.getRole()
                    );

            Map<String, Object> data =
                    new HashMap<>();

            data.put(
                    "id",
                    saved.getId()
            );

            data.put(
                    "email",
                    saved.getEmail()
            );

            data.put(
                    "username",
                    saved.getUsername()
            );

            data.put(
                    "role",
                    saved.getRole()
            );

            data.put(
                    "token",
                    token
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            ApiResponse.success(
                                    "Account verified and created successfully",
                                    data
                            )
                    );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // EMAIL OTP LOGIN / SIGNUP
    // POST /api/auth/email/request-otp
    // ============================================================

    @PostMapping("/email/request-otp")
    public ResponseEntity<ApiResponse<Void>>
    requestEmailOtp(
            @RequestBody Map<String, String> request) {

        String email =
                request == null
                        ? null
                        : request.get("email");

        if (email == null
                || email.isBlank()
                || !email.matches(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Please enter a valid email address"
                            )
                    );
        }

        try {

            emailLoginOtpService.requestOtp(email);

            return ResponseEntity
                    .ok(
                            ApiResponse.success(
                                    "Verification OTP sent",
                                    null
                            )
                    );

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(
                            HttpStatus.TOO_MANY_REQUESTS
                    )
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            ApiResponse.error(
                                    "Unable to send OTP. "
                                            + "Please try again later."
                            )
                    );
        }
    }


    // ============================================================
    // VERIFY EMAIL OTP
    // POST /api/auth/email/verify-otp
    // ============================================================

    @PostMapping("/email/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
    verifyEmailOtp(
            @RequestBody EmailOtpRequest request) {

        if (request == null
                || request.getEmail() == null
                || request.getEmail().isBlank()
                || request.getOtp() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Email and OTP are required"
                            )
                    );
        }

        try {

            User user =
                    emailLoginOtpService.verifyOtp(
                            request.getEmail(),
                            request.getOtp().trim()
                    );

            String token =
                    jwtUtil.generateToken(
                            user.getEmail(),
                            user.getRole()
                    );

            Map<String, Object> data =
                    new HashMap<>();

            data.put(
                    "id",
                    user.getId()
            );

            data.put(
                    "email",
                    user.getEmail()
            );

            data.put(
                    "username",
                    user.getUsername()
            );

            data.put(
                    "role",
                    user.getRole()
            );

            data.put(
                    "token",
                    token
            );

            return ResponseEntity
                    .ok(
                            ApiResponse.success(
                                    "Email verified and signed in",
                                    data
                            )
                    );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // GOOGLE OAUTH LOGIN
    // GET /api/auth/google
    // ============================================================

    @GetMapping("/google")
    public void startGoogleLogin(
            HttpServletResponse response,
            HttpSession session
    ) throws IOException {

        if (googleClientId == null
                || googleClientId.isBlank()) {

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            "Google client ID is not configured",
                            StandardCharsets.UTF_8
                    )
            );

            return;
        }

        if (googleRedirectUri == null
                || googleRedirectUri.isBlank()) {

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            "Google redirect URI is not configured",
                            StandardCharsets.UTF_8
                    )
            );

            return;
        }

        // ========================================================
        // Generate OAuth state
        // ========================================================

        String state =
                UUID.randomUUID().toString();

        session.setAttribute(
                "GOOGLE_OAUTH_STATE",
                state
        );


        // ========================================================
        // Build Google OAuth authorization URL
        // ========================================================

        String googleAuthorizationUrl =
                "https://accounts.google.com/o/oauth2/v2/auth"
                        + "?client_id="
                        + URLEncoder.encode(
                        googleClientId,
                        StandardCharsets.UTF_8
                )
                        + "&redirect_uri="
                        + URLEncoder.encode(
                        googleRedirectUri,
                        StandardCharsets.UTF_8
                )
                        + "&response_type=code"
                        + "&scope="
                        + URLEncoder.encode(
                        "openid email profile",
                        StandardCharsets.UTF_8
                )
                        + "&access_type=online"
                        + "&state="
                        + URLEncoder.encode(
                        state,
                        StandardCharsets.UTF_8
                );

        response.sendRedirect(
                googleAuthorizationUrl
        );
    }


    // ============================================================
    // GOOGLE OAUTH CALLBACK
    // GET /api/auth/google/callback
    // ============================================================

    @GetMapping("/google/callback")
    public void googleCallback(
            @RequestParam(value = "code", required = false)
            String code,

            @RequestParam(value = "state", required = false)
            String state,

            @RequestParam(value = "error", required = false)
            String error,

            HttpServletResponse response,
            HttpSession session
    ) throws IOException {

        // ========================================================
        // Google returned an OAuth error
        // ========================================================

        if (error != null && !error.isBlank()) {

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            error,
                            StandardCharsets.UTF_8
                    )
            );

            return;
        }


        // ========================================================
        // Authorization code validation
        // ========================================================

        if (code == null || code.isBlank()) {

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            "Google authorization code is missing",
                            StandardCharsets.UTF_8
                    )
            );

            return;
        }


        // ========================================================
        // State validation
        // ========================================================

        Object storedStateObject =
                session.getAttribute(
                        "GOOGLE_OAUTH_STATE"
                );

        String storedState =
                storedStateObject == null
                        ? null
                        : String.valueOf(
                        storedStateObject
                );

        /*
         * Remove the state immediately.
         * This prevents reuse of the same OAuth state.
         */
        session.removeAttribute(
                "GOOGLE_OAUTH_STATE"
        );

        if (storedState == null
                || state == null
                || !storedState.equals(state)) {

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            "Invalid Google OAuth state",
                            StandardCharsets.UTF_8
                    )
            );

            return;
        }


        // ========================================================
        // Process Google login
        // ========================================================

        try {

            User user =
                    googleAuthService
                            .loginWithAuthorizationCode(
                                    code
                            );


            // ====================================================
            // Generate Zyphora JWT
            // ====================================================

            String token =
                    jwtUtil.generateToken(
                            user.getEmail(),
                            user.getRole()
                    );


            // ====================================================
            // Redirect to React
            // ====================================================

            String encodedToken =
                    URLEncoder.encode(
                            token,
                            StandardCharsets.UTF_8
                    );

            response.sendRedirect(
                    getFrontendUrl() + "/oauth-success?token="
                            + encodedToken
            );

        } catch (IllegalArgumentException e) {

            String message =
                    e.getMessage() == null
                            ? "Google authentication failed"
                            : e.getMessage();

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            message,
                            StandardCharsets.UTF_8
                    )
            );

        } catch (IllegalStateException e) {

            String message =
                    e.getMessage() == null
                            ? "Google authentication is not configured"
                            : e.getMessage();

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            message,
                            StandardCharsets.UTF_8
                    )
            );

        } catch (Exception e) {

            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "ZYPHORA GOOGLE OAUTH FAILURE"
            );

            System.err.println(
                    "Error type: "
                            + e.getClass().getName()
            );

            System.err.println(
                    "Error message: "
                            + e.getMessage()
            );

            if (e.getCause() != null) {

                System.err.println(
                        "Cause type: "
                                + e.getCause()
                                .getClass()
                                .getName()
                );

                System.err.println(
                        "Cause message: "
                                + e.getCause()
                                .getMessage()
                );
            }

            System.err.println(
                    "================================================"
            );

            response.sendRedirect(
                    getFrontendUrl() + "/login?googleError="
                            + URLEncoder.encode(
                            "Google sign-in could not be completed",
                            StandardCharsets.UTF_8
                    )
            );
        }
    }


    // ============================================================
    // LOGIN
    // POST /api/auth/login
    // ============================================================

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @RequestBody Map<String, String> request) {

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Login request is required"
                            )
                    );
        }

        String email =
                request.get("email");

        String password =
                request.get("password");

        if (email == null
                || email.isBlank()
                || password == null
                || password.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Email and password are required"
                            )
                    );
        }

        email =
                email.trim()
                        .toLowerCase();

        Optional<User> userOpt =
                userRepository.findByEmail(email);

        if (userOpt.isEmpty()
                || !passwordEncoder.matches(
                password,
                userOpt.get().getPassword())) {

            return ResponseEntity
                    .status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            ApiResponse.error(
                                    "Invalid email or password"
                            )
                    );
        }

        User user =
                userOpt.get();

        String token =
                jwtUtil.generateToken(
                        user.getEmail(),
                        user.getRole()
                );

        Map<String, Object> data =
                new HashMap<>();

        data.put(
                "id",
                user.getId()
        );

        data.put(
                "email",
                user.getEmail()
        );

        data.put(
                "username",
                user.getUsername()
        );

        data.put(
                "role",
                user.getRole()
        );

        data.put(
                "token",
                token
        );

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Login successful",
                                data
                        )
                );
    }


    // ============================================================
    // FORGOT PASSWORD - GENERATE OTP
    // POST /api/auth/forgot-password/generate-otp
    // ============================================================

    @PostMapping("/forgot-password/generate-otp")
    public ResponseEntity<ApiResponse<Void>> generateOtp(
            @RequestBody ForgotPasswordRequest request) {

        if (request == null
                || request.getEmail() == null
                || request.getEmail().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Email is required"
                            )
                    );
        }

        boolean sent =
                forgotPasswordService.generateAndSendOtp(
                        request.getEmail()
                );

        if (!sent) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            ApiResponse.error(
                                    "No account found with that email"
                            )
                    );
        }

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "OTP sent successfully",
                                null
                        )
                );
    }


    // ============================================================
    // RESET PASSWORD
    // POST /api/auth/forgot-password/reset
    // ============================================================

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Reset request is required"
                            )
                    );
        }

        if (request.getEmail() == null
                || request.getEmail().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Email is required"
                            )
                    );
        }

        if (request.getOtp() == null
                || request.getOtp().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "OTP is required"
                            )
                    );
        }

        if (request.getNewPassword() == null
                || request.getNewPassword().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "New password is required"
                            )
                    );
        }

        boolean reset =
                forgotPasswordService.resetPassword(
                        request.getEmail(),
                        request.getOtp(),
                        request.getNewPassword()
                );

        if (!reset) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            ApiResponse.error(
                                    "Invalid or expired OTP"
                            )
                    );
        }

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Password reset successful",
                                null
                        )
                );
    }


    // ============================================================
    // GET PROFILE
    // GET /api/auth/profile
    // ============================================================

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
    getProfile() {

        User user =
                getAuthenticatedUser();

        if (user == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            ApiResponse.error(
                                    "Unauthorized — please log in"
                            )
                    );
        }

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Profile fetched successfully",
                                buildProfileMap(user)
                        )
                );
    }


    // ============================================================
    // UPDATE PROFILE
    // PUT /api/auth/profile
    // ============================================================

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
    updateProfile(
            @RequestBody Map<String, Object> request) {

        User user =
                getAuthenticatedUser();

        if (user == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            ApiResponse.error(
                                    "Unauthorized — please log in"
                            )
                    );
        }

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Profile update request is required"
                            )
                    );
        }


        // ========================================================
        // USERNAME
        // ========================================================

        if (request.containsKey("username")) {

            String newUsername =
                    nullOrTrimmed(
                            request.get("username")
                    );

            if (newUsername == null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                ApiResponse.error(
                                        "Username cannot be blank"
                                )
                        );
            }

            if (!newUsername.equals(
                    user.getUsername())
                    && userRepository
                    .existsByUsername(newUsername)) {

                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(
                                ApiResponse.error(
                                        "Username already taken"
                                )
                        );
            }

            user.setUsername(
                    newUsername
            );
        }


        // ========================================================
        // PHONE
        // ========================================================

        if (request.containsKey("phoneNumber")) {

            user.setPhone(
                    nullOrTrimmed(
                            request.get("phoneNumber")
                    )
            );
        }


        // ========================================================
        // ADDRESS
        // ========================================================

        if (request.containsKey("address")) {

            user.setAddress(
                    nullOrTrimmed(
                            request.get("address")
                    )
            );
        }


        // ========================================================
        // CITY
        // ========================================================

        if (request.containsKey("city")) {

            user.setCity(
                    nullOrTrimmed(
                            request.get("city")
                    )
            );
        }


        // ========================================================
        // STATE
        // ========================================================

        if (request.containsKey("state")) {

            user.setState(
                    nullOrTrimmed(
                            request.get("state")
                    )
            );
        }


        // ========================================================
        // COUNTRY
        // ========================================================

        if (request.containsKey("country")) {

            user.setCountry(
                    nullOrTrimmed(
                            request.get("country")
                    )
            );
        }


        // ========================================================
        // ZIP CODE
        // ========================================================

        if (request.containsKey("zipCode")) {

            user.setZipCode(
                    nullOrTrimmed(
                            request.get("zipCode")
                    )
            );
        }


        // ========================================================
        // SAVE
        // ========================================================

        User updated =
                userRepository.save(user);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Profile updated successfully",
                                buildProfileMap(updated)
                        )
                );
    }


    // ============================================================
    // CHANGE PASSWORD
    // PUT /api/auth/profile/change-password
    // ============================================================

    @PutMapping("/profile/change-password")
    public ResponseEntity<ApiResponse<Void>>
    changePassword(
            @RequestBody Map<String, String> request) {

        User user =
                getAuthenticatedUser();

        if (user == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            ApiResponse.error(
                                    "Unauthorized — please log in"
                            )
                    );
        }

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Password change request is required"
                            )
                    );
        }

        String currentPassword =
                request.get("currentPassword");

        String newPassword =
                request.get("newPassword");

        if (currentPassword == null
                || currentPassword.isBlank()
                || newPassword == null
                || newPassword.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "Both currentPassword and "
                                            + "newPassword are required"
                            )
                    );
        }

        if (!newPassword.matches(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
                        + "(?=.*[^A-Za-z0-9]).{8,72}$")) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.error(
                                    "New password must be 8-72 characters "
                                            + "and include uppercase, "
                                            + "lowercase, number and "
                                            + "special character"
                            )
                    );
        }

        if (!passwordEncoder.matches(
                currentPassword,
                user.getPassword())) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            ApiResponse.error(
                                    "Current password is incorrect"
                            )
                    );
        }

        user.setPassword(
                passwordEncoder.encode(
                        newPassword
                )
        );

        userRepository.save(user);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Password changed successfully",
                                null
                        )
                );
    }


    // ============================================================
    // DELETE ACCOUNT
    // DELETE /api/auth/profile
    // ============================================================

    @DeleteMapping("/profile")
    public ResponseEntity<ApiResponse<Void>>
    deleteAccount() {

        User user =
                getAuthenticatedUser();

        if (user == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            ApiResponse.error(
                                    "Unauthorized — please log in"
                            )
                    );
        }

        userRepository.delete(user);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Account permanently deleted",
                                null
                        )
                );
    }
}
