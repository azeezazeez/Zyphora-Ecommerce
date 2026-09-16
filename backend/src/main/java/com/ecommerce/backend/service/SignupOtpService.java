package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
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

    private final Map<String, PendingRegistration> pending =
            new ConcurrentHashMap<>();

    /**
     * Generates and sends an OTP for a new registration.
     */
    public void requestOtp(String email, String username, String password) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedUsername = username.trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException("Username already taken");
        }

        LocalDateTime now = LocalDateTime.now();

        PendingRegistration existing = pending.get(normalizedEmail);

        if (existing != null) {
            LocalDateTime cooldownEnd =
                    existing.sentAt().plusSeconds(RESEND_COOLDOWN_SECONDS);

            if (cooldownEnd.isAfter(now)) {
                long seconds = Duration
                        .between(now, cooldownEnd)
                        .getSeconds();

                throw new IllegalStateException(
                        "Please wait "
                                + Math.max(1, seconds)
                                + " seconds before requesting another OTP"
                );
            }
        }

        String otp = String.format(
                "%06d",
                RANDOM.nextInt(1_000_000)
        );

        PendingRegistration registration =
                new PendingRegistration(
                        normalizedEmail,
                        normalizedUsername,
                        passwordEncoder.encode(password),
                        otp,
                        now.plusMinutes(OTP_TTL_MINUTES),
                        now,
                        0
                );

        pending.put(normalizedEmail, registration);

        try {
            emailService.sendSignupOtp(
                    normalizedEmail,
                    otp,
                    normalizedUsername
            );
        } catch (RuntimeException ex) {
            pending.remove(normalizedEmail);
            throw new IllegalStateException(
                    "Unable to send OTP email. Please try again later."
            );
        }
    }

    /**
     * Verifies the OTP and creates the user account.
     */
    public User verifyOtp(String email, String otp) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException("OTP is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedOtp = otp.trim();

        PendingRegistration registration =
                pending.get(normalizedEmail);

        if (registration == null) {
            throw new IllegalArgumentException(
                    "No pending registration found. Please request a new OTP"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (registration.expiry().isBefore(now)) {
            pending.remove(normalizedEmail);

            throw new IllegalArgumentException(
                    "OTP has expired. Please request a new OTP"
            );
        }

        if (registration.attempts() >= MAX_ATTEMPTS) {
            pending.remove(normalizedEmail);

            throw new IllegalArgumentException(
                    "Too many invalid OTP attempts. Please request a new OTP"
            );
        }

        if (!registration.otp().equals(normalizedOtp)) {

            pending.computeIfPresent(
                    normalizedEmail,
                    (key, current) ->
                            current.withAttempts(
                                    current.attempts() + 1
                            )
            );

            throw new IllegalArgumentException("Invalid OTP");
        }

        /*
         * Double-check that the email and username were not registered
         * while the OTP was pending.
         */
        if (userRepository.existsByEmail(normalizedEmail)) {
            pending.remove(normalizedEmail);

            throw new IllegalArgumentException(
                    "Email already registered"
            );
        }

        if (userRepository.existsByUsername(registration.username())) {
            pending.remove(normalizedEmail);

            throw new IllegalArgumentException(
                    "Username already taken"
            );
        }

        User user = new User();

        user.setEmail(normalizedEmail);
        user.setUsername(registration.username());
        user.setPassword(registration.encodedPassword());

        /*
         * Preserve the existing application behavior:
         * the first registered user becomes ADMIN,
         * subsequent users become USER.
         */
        user.setRole(
                userRepository.count() == 0
                        ? "ADMIN"
                        : "USER"
        );

        User savedUser = userRepository.save(user);

        pending.remove(normalizedEmail);

        return savedUser;
    }

    /**
     * Temporary registration data stored until OTP verification.
     */
    private record PendingRegistration(
            String email,
            String username,
            String encodedPassword,
            String otp,
            LocalDateTime expiry,
            LocalDateTime sentAt,
            int attempts
    ) {

        PendingRegistration withAttempts(int value) {
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
