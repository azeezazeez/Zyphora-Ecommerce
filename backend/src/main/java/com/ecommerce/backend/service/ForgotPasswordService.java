package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.PasswordReset;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.PasswordResetRepository;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;

    /**
     * Generates a cryptographically secure 6-digit OTP.
     */
    public String generateOtp() {
        int otp = SECURE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(otp);
    }

    /**
     * Sends an OTP email.
     */
    public void sendOtpEmail(String email, String otp) {
        validateEmail(email);
        validateOtp(otp);

        emailService.sendOtp(email.trim().toLowerCase(), otp);
    }

    /**
     * Generates and sends a password-reset OTP.
     *
     * @return true if the user exists and the OTP was successfully prepared/sent,
     *         false if no user exists.
     */
    @Transactional
    public boolean generateAndSendOtp(String email) {
        validateEmail(email);

        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        if (user == null) {
            return false;
        }

        String otp = generateOtp();
        LocalDateTime now = LocalDateTime.now();

        PasswordReset reset = passwordResetRepository
                .findByEmail(normalizedEmail)
                .orElseGet(PasswordReset::new);

        reset.setEmail(normalizedEmail);
        reset.setOtp(otp);
        reset.setExpiryTime(now.plusMinutes(OTP_EXPIRY_MINUTES));
        reset.setAttemptCount(0);

        passwordResetRepository.save(reset);

        try {
            sendOtpEmail(normalizedEmail, otp);
        } catch (RuntimeException e) {
            // Do not leave a usable OTP behind if email delivery failed.
            reset.setOtp(null);
            reset.setExpiryTime(null);
            reset.setAttemptCount(0);
            passwordResetRepository.save(reset);

            throw new IllegalStateException(
                    "Unable to send OTP email. Please try again later.",
                    e
            );
        }

        return true;
    }

    /**
     * Verifies a password-reset OTP.
     */
    @Transactional
    public boolean verifyOtp(String email, String otp) {
        if (email == null || email.isBlank()) {
            return false;
        }

        if (otp == null || otp.isBlank()) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedOtp = otp.trim();

        if (!normalizedOtp.matches("\\d{" + OTP_LENGTH + "}")) {
            return false;
        }

        PasswordReset reset = passwordResetRepository
                .findByEmail(normalizedEmail)
                .orElse(null);

        if (reset == null) {
            return false;
        }

        LocalDateTime expiryTime = reset.getExpiryTime();

        if (expiryTime == null || expiryTime.isBefore(LocalDateTime.now())) {
            return false;
        }

        Integer attemptCount = reset.getAttemptCount();

        if (attemptCount == null) {
            attemptCount = 0;
        }

        if (attemptCount >= MAX_ATTEMPTS) {
            return false;
        }

        String storedOtp = reset.getOtp();

        if (storedOtp == null || !storedOtp.equals(normalizedOtp)) {
            reset.setAttemptCount(attemptCount + 1);
            passwordResetRepository.save(reset);
            return false;
        }

        return true;
    }

    /**
     * Resets the user's password after successful OTP verification.
     */
    @Transactional
    public boolean resetPassword(
            String email,
            String otp,
            String newPassword
    ) {
        if (email == null || email.isBlank()) {
            return false;
        }

        if (otp == null || otp.isBlank()) {
            return false;
        }

        if (newPassword == null || newPassword.isBlank()) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedOtp = otp.trim();

        if (!verifyOtp(normalizedEmail, normalizedOtp)) {
            return false;
        }

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElse(null);

        if (user == null) {
            return false;
        }

        // Always store the encoded password, never the plain-text password.
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        PasswordReset reset = passwordResetRepository
                .findByEmail(normalizedEmail)
                .orElse(null);

        if (reset != null) {
            // Invalidate the OTP immediately after successful password reset.
            reset.setOtp(null);
            reset.setExpiryTime(null);
            reset.setAttemptCount(0);
            passwordResetRepository.save(reset);
        }

        return true;
    }

    private void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }

        String normalizedEmail = email.trim();

        if (!normalizedEmail.matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
        )) {
            throw new IllegalArgumentException("Please provide a valid email address.");
        }
    }

    private void validateOtp(String otp) {
        if (otp == null || !otp.trim().matches("\\d{" + OTP_LENGTH + "}")) {
            throw new IllegalArgumentException("OTP must be a 6-digit number.");
        }
    }
}
