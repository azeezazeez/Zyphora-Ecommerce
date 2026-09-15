package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.PasswordReset;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.PasswordResetRepository;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp() {
        int otp = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(otp);
    }

    public void sendOtpEmail(String email, String otp) {
        emailService.sendOtp(email, otp);
    }

    public boolean generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        String otp = generateOtp();

        PasswordReset reset = passwordResetRepository
                .findByEmail(email)
                .orElse(new PasswordReset());

        reset.setEmail(email);
        reset.setOtp(otp);
        reset.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        reset.setAttemptCount(0);
        passwordResetRepository.save(reset);

        sendOtpEmail(email, otp);
        return true;
    }

    public boolean verifyOtp(String email, String otp) {
        PasswordReset reset = passwordResetRepository
                .findByEmail(email)
                .orElse(null);

        if (reset == null) return false;
        if (reset.getExpiryTime().isBefore(LocalDateTime.now())) return false;
        if (reset.getAttemptCount() >= 5) return false;

        if (!reset.getOtp().equals(otp)) {
            reset.setAttemptCount(reset.getAttemptCount() + 1);
            passwordResetRepository.save(reset);
            return false;
        }

        return true;
    }

    public boolean resetPassword(String email, String otp, String newPassword) {
        if (!verifyOtp(email, otp)) return false;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        // ✅ Hash the new password before saving
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        PasswordReset reset = passwordResetRepository.findByEmail(email).orElse(null);
        if (reset != null) {
            reset.setOtp(null);
            reset.setExpiryTime(null);
            reset.setAttemptCount(0);
            passwordResetRepository.save(reset);
        }

        return true;
    }
}
