package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SignupOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final int MAX_ATTEMPTS = 5;
    private static final long OTP_TTL_MINUTES = 5;
    private static final long RESEND_COOLDOWN_SECONDS = 60;

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /*
     * Temporary OTP registrations.
     *
     * This data remains in memory until:
     * - OTP is successfully verified
     * - OTP expires
     * - sending the email fails
     * - the application restarts
     */
    private final Map<String, PendingRegistration> pending =
            new ConcurrentHashMap<>();

    // ============================================================
    // REQUEST SIGNUP OTP
    // ============================================================

    public void requestOtp(
            String email,
            String username,
            String password) {

        validateSignupInput(
                email,
                username,
                password
        );

        String normalizedEmail =
                normalizeEmail(email);

        String normalizedUsername =
                username.trim();

        /*
         * Check whether the account already exists.
         */
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException(
                    "Email already registered"
            );
        }

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException(
                    "Username already taken"
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        /*
         * Prevent OTP spam.
         */
        PendingRegistration existing =
                pending.get(normalizedEmail);

        if (existing != null) {

            LocalDateTime cooldownEnd =
                    existing.sentAt()
                            .plusSeconds(
                                    RESEND_COOLDOWN_SECONDS
                            );

            if (cooldownEnd.isAfter(now)) {

                long seconds =
                        Duration.between(
                                now,
                                cooldownEnd
                        ).getSeconds();

                throw new IllegalStateException(
                        "Please wait "
                                + Math.max(1, seconds)
                                + " seconds before requesting another OTP"
                );
            }
        }

        /*
         * Generate a secure six-digit OTP.
         */
        String otp =
                String.format(
                        Locale.ROOT,
                        "%06d",
                        RANDOM.nextInt(1_000_000)
                );

        /*
         * Encode the password before storing it temporarily.
         */
        String encodedPassword =
                passwordEncoder.encode(password);

        PendingRegistration registration =
                new PendingRegistration(
                        normalizedEmail,
                        normalizedUsername,
                        encodedPassword,
                        otp,
                        now.plusMinutes(
                                OTP_TTL_MINUTES
                        ),
                        now,
                        0
                );

        /*
         * Store registration BEFORE sending email.
         *
         * If sending fails, it will be removed below.
         */
        pending.put(
                normalizedEmail,
                registration
        );

        try {

            emailService.sendSignupOtp(
                    normalizedEmail,
                    otp,
                    normalizedUsername
            );

            /*
             * Do not log the OTP itself.
             */
            System.out.println(
                    "Signup OTP email request completed for: "
                            + normalizedEmail
            );

        } catch (Exception exception) {

            /*
             * Remove the temporary registration because
             * the user did not receive a usable OTP.
             */
            pending.remove(
                    normalizedEmail
            );

            /*
             * Log the actual exception on Render.
             *
             * IMPORTANT:
             * We never log passwords or API keys.
             */
            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "SIGNUP OTP EMAIL FAILED"
            );

            System.err.println(
                    "Recipient: "
                            + normalizedEmail
            );

            System.err.println(
                    "Exception type: "
                            + exception.getClass().getName()
            );

            System.err.println(
                    "Exception message: "
                            + exception.getMessage()
            );

            System.err.println(
                    "================================================"
            );

            /*
             * Preserve useful diagnostic information instead
             * of hiding the original exception.
             */
            throw new IllegalStateException(
                    "Unable to send OTP email: "
                            + safeMessage(exception),
                    exception
            );
        }
    }

    // ============================================================
    // VERIFY OTP
    // ============================================================

    public User verifyOtp(
            String email,
            String otp) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Email is required"
            );
        }

        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "OTP is required"
            );
        }

        String normalizedEmail =
                normalizeEmail(email);

        String normalizedOtp =
                otp.trim();

        if (!normalizedOtp.matches("\\d{6}")) {
            throw new IllegalArgumentException(
                    "OTP must be exactly 6 digits"
            );
        }

        PendingRegistration registration =
                pending.get(normalizedEmail);

        if (registration == null) {
            throw new IllegalArgumentException(
                    "No pending registration found. Please request a new OTP"
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        /*
         * OTP expiry check.
         */
        if (registration.expiry().isBefore(now)) {

            pending.remove(
                    normalizedEmail
            );

            throw new IllegalArgumentException(
                    "OTP has expired. Please request a new OTP"
            );
        }

        /*
         * Maximum invalid attempts.
         */
        if (registration.attempts() >= MAX_ATTEMPTS) {

            pending.remove(
                    normalizedEmail
            );

            throw new IllegalArgumentException(
                    "Too many invalid OTP attempts. Please request a new OTP"
            );
        }

        /*
         * OTP comparison.
         */
        if (!registration.otp().equals(normalizedOtp)) {

            pending.computeIfPresent(
                    normalizedEmail,
                    (key, current) ->
                            current.withAttempts(
                                    current.attempts() + 1
                            )
            );

            throw new IllegalArgumentException(
                    "Invalid OTP"
            );
        }

        /*
         * Double-check that another request did not register
         * this email while the OTP was pending.
         */
        if (userRepository.existsByEmail(normalizedEmail)) {

            pending.remove(
                    normalizedEmail
            );

            throw new IllegalArgumentException(
                    "Email already registered"
            );
        }

        if (userRepository.existsByUsername(
                registration.username()
        )) {

            pending.remove(
                    normalizedEmail
            );

            throw new IllegalArgumentException(
                    "Username already taken"
            );
        }

        /*
         * Create the actual user account.
         */
        User user =
                new User();

        user.setEmail(
                normalizedEmail
        );

        user.setUsername(
                registration.username()
        );

        user.setPassword(
                registration.encodedPassword()
        );

        /*
         * Preserve the existing application behavior:
         * first registered user = ADMIN
         * subsequent users = USER
         */
        user.setRole(
                userRepository.count() == 0
                        ? "ADMIN"
                        : "USER"
        );

        User savedUser =
                userRepository.save(user);

        /*
         * OTP can no longer be reused.
         */
        pending.remove(
                normalizedEmail
        );

        return savedUser;
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    private void validateSignupInput(
            String email,
            String username,
            String password) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Email is required"
            );
        }

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Username is required"
            );
        }

        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException(
                    "Password is required"
            );
        }

        String normalizedEmail =
                normalizeEmail(email);

        if (!isValidEmail(normalizedEmail)) {
            throw new IllegalArgumentException(
                    "Please provide a valid email address"
            );
        }

        if (username.trim().length() < 3) {
            throw new IllegalArgumentException(
                    "Username must be at least 3 characters"
            );
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters"
            );
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private String normalizeEmail(
            String email) {

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private boolean isValidEmail(
            String email) {

        return email != null
                && email.matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        );
    }

    private String safeMessage(
            Exception exception) {

        if (exception.getMessage() == null
                || exception.getMessage().isBlank()) {

            return "Unknown email service error";
        }

        String message =
                exception.getMessage()
                        .replace("\r", " ")
                        .replace("\n", " ")
                        .trim();

        if (message.length() > 1000) {
            return message.substring(0, 1000)
                    + "...";
        }

        return message;
    }

    // ============================================================
    // PENDING REGISTRATION
    // ============================================================

    private record PendingRegistration(
            String email,
            String username,
            String encodedPassword,
            String otp,
            LocalDateTime expiry,
            LocalDateTime sentAt,
            int attempts
    ) {

        PendingRegistration withAttempts(
                int value) {

            return new PendingRegistration(
                    email,
                    username,
                    encodedPassword,
                    otp,
                    expiry,
                    sentAt,
                    value
            );
        }
    }
}
