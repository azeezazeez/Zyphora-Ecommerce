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
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailLoginOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long OTP_TTL_MINUTES = 5;
    private static final long RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final Map<String, PendingOtp> pending = new ConcurrentHashMap<>();

    public void requestOtp(String email) {

        String normalizedEmail = normalize(email);
        LocalDateTime now = LocalDateTime.now();
        PendingOtp existing = pending.get(normalizedEmail);

        if (existing != null
                && existing.sentAt()
                        .plusSeconds(RESEND_COOLDOWN_SECONDS)
                        .isAfter(now)) {

            long seconds = Duration.between(
                    now,
                    existing.sentAt()
                            .plusSeconds(RESEND_COOLDOWN_SECONDS)
            ).getSeconds();

            throw new IllegalStateException(
                    "Please wait "
                            + Math.max(1, seconds)
                            + " seconds before requesting another OTP"
            );
        }

        String otp = String.format(
                "%06d",
                RANDOM.nextInt(1_000_000)
        );

        String name = userRepository.findByEmail(normalizedEmail)
                .map(User::getUsername)
                .orElse("Zyphora User");

        // Send the email first. The OTP is stored only after Brevo
        // accepts the message, so a failed email never creates a
        // misleading pending OTP/cooldown.
        emailService.sendSignupOtp(
                normalizedEmail,
                otp,
                name
        );

        pending.put(
                normalizedEmail,
                new PendingOtp(
                        otp,
                        now.plusMinutes(OTP_TTL_MINUTES),
                        LocalDateTime.now(),
                        0
                )
        );
    }

    public User verifyOtp(String email, String otp) {

        String normalizedEmail = normalize(email);
        PendingOtp current = pending.get(normalizedEmail);

        if (current == null) {
            throw new IllegalArgumentException(
                    "No pending OTP found. Please request a new OTP"
            );
        }

        if (current.expiry().isBefore(LocalDateTime.now())) {
            pending.remove(normalizedEmail);
            throw new IllegalArgumentException(
                    "OTP has expired. Please request a new OTP"
            );
        }

        if (otp == null || !otp.matches("\\d{6}")) {
            throw new IllegalArgumentException(
                    "OTP must be exactly 6 digits"
            );
        }

        if (!current.otp().equals(otp)) {
            int attempts = current.attempts() + 1;

            if (attempts >= MAX_ATTEMPTS) {
                pending.remove(normalizedEmail);
            } else {
                pending.put(
                        normalizedEmail,
                        current.withAttempts(attempts)
                );
            }

            throw new IllegalArgumentException(
                    "Invalid OTP. Please check the code and try again"
            );
        }

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElseGet(() -> createUser(normalizedEmail));

        pending.remove(normalizedEmail);

        return user;
    }

    private User createUser(String email) {

        String local = email
                .substring(0, email.indexOf('@'))
                .replaceAll("[^a-zA-Z0-9._-]", "");

        if (local.length() < 3) {
            local = "zyphorauser";
        }

        local = local.substring(
                0,
                Math.min(30, local.length())
        );

        String username = local;
        int suffix = 1;

        while (userRepository.existsByUsername(username)) {
            String extra = "_" + suffix++;

            username = local.substring(
                    0,
                    Math.min(
                            50 - extra.length(),
                            local.length()
                    )
            ) + extra;
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(
                passwordEncoder.encode(UUID.randomUUID().toString())
        );
        user.setRole("USER");

        return userRepository.save(user);
    }

    private String normalize(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        return email.trim().toLowerCase();
    }

    private record PendingOtp(
            String otp,
            LocalDateTime expiry,
            LocalDateTime sentAt,
            int attempts) {

        PendingOtp withAttempts(int value) {
            return new PendingOtp(
                    otp,
                    expiry,
                    sentAt,
                    value
            );
        }
    }
}
