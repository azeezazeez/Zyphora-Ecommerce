package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
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

    private final Map<String, PendingRegistration> pending = new ConcurrentHashMap<>();

    public void requestOtp(String email, String username, String password) {
        String normalizedEmail = email.trim().toLowerCase();
        String normalizedUsername = username.trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException("Username already taken");
        }

        PendingRegistration existing = pending.get(normalizedEmail);
        if (existing != null && existing.sentAt.plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            long seconds = java.time.Duration.between(LocalDateTime.now(), existing.sentAt.plusSeconds(RESEND_COOLDOWN_SECONDS)).getSeconds();
            throw new IllegalStateException("Please wait " + Math.max(1, seconds) + " seconds before requesting another OTP");
        }

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        pending.put(normalizedEmail, new PendingRegistration(
                normalizedEmail, normalizedUsername, passwordEncoder.encode(password), otp,
                LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES), LocalDateTime.now(), 0));

        emailService.sendSignupOtp(normalizedEmail, otp, normalizedUsername);
    }

    public User verifyOtp(String email, String otp) {
        String normalizedEmail = email.trim().toLowerCase();
        PendingRegistration registration = pending.get(normalizedEmail);

        if (registration == null) throw new IllegalArgumentException("No pending registration found. Please request a new OTP");
        if (registration.expiry.isBefore(LocalDateTime.now())) {
            pending.remove(normalizedEmail);
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP");
        }
        if (registration.attempts >= MAX_ATTEMPTS) {
            pending.remove(normalizedEmail);
            throw new IllegalArgumentException("Too many invalid OTP attempts. Please request a new OTP");
        }
        if (!registration.otp.equals(otp)) {
            pending.computeIfPresent(normalizedEmail, (k, v) -> v.withAttempts(v.attempts + 1));
            throw new IllegalArgumentException("Invalid OTP");
        }

        if (userRepository.existsByEmail(normalizedEmail)) throw new IllegalArgumentException("Email already registered");
        if (userRepository.existsByUsername(registration.username)) throw new IllegalArgumentException("Username already taken");

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setUsername(registration.username);
        user.setPassword(registration.encodedPassword);
        user.setRole(userRepository.count() == 0 ? "ADMIN" : "USER");
        User saved = userRepository.save(user);
        pending.remove(normalizedEmail);
        return saved;
    }

    private record PendingRegistration(String email, String username, String encodedPassword, String otp,
                                       LocalDateTime expiry, LocalDateTime sentAt, int attempts) {
        PendingRegistration withAttempts(int value) {
            return new PendingRegistration(email, username, encodedPassword, otp, expiry, sentAt, value);
        }
    }
}
