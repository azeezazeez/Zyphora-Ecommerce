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

    /*
     * OTP storage.
     *
     * NOTE:
     * This is application-memory storage.
     * It works correctly for a single running backend instance.
     */
    private final Map<String, PendingOtp> pending =
            new ConcurrentHashMap<>();


    // ============================================================
    // REQUEST OTP
    // ============================================================

    public void requestOtp(String email) {

        String normalizedEmail = normalize(email);

        LocalDateTime now = LocalDateTime.now();

        PendingOtp existing =
                pending.get(normalizedEmail);

        // --------------------------------------------------------
        // RESEND COOLDOWN
        // --------------------------------------------------------

        if (existing != null
                && existing.sentAt()
                .plusSeconds(RESEND_COOLDOWN_SECONDS)
                .isAfter(now)) {

            long seconds =
                    Duration.between(
                            now,
                            existing.sentAt()
                                    .plusSeconds(
                                            RESEND_COOLDOWN_SECONDS
                                    )
                    ).getSeconds();

            throw new IllegalStateException(
                    "Please wait "
                            + Math.max(1, seconds)
                            + " seconds before requesting another OTP"
            );
        }


        // --------------------------------------------------------
        // GENERATE OTP
        // --------------------------------------------------------

        String otp =
                String.format(
                        "%06d",
                        RANDOM.nextInt(1_000_000)
                );


        // --------------------------------------------------------
        // FIND USER NAME
        // --------------------------------------------------------

        String name =
                userRepository
                        .findByEmail(normalizedEmail)
                        .map(User::getUsername)
                        .orElse("Zyphora User");


        // --------------------------------------------------------
        // SEND EMAIL
        // --------------------------------------------------------

        emailService.sendSignupOtp(
                normalizedEmail,
                otp,
                name
        );


        // --------------------------------------------------------
        // STORE OTP
        //
        // Store AFTER successful email delivery.
        // --------------------------------------------------------

        LocalDateTime sentAt =
                LocalDateTime.now();

        LocalDateTime expiry =
                sentAt.plusMinutes(
                        OTP_TTL_MINUTES
                );

        pending.put(
                normalizedEmail,
                new PendingOtp(
                        otp,
                        expiry,
                        sentAt,
                        0
                )
        );


        // --------------------------------------------------------
        // TEMPORARY SERVER LOG
        //
        // Remove this after testing.
        // --------------------------------------------------------

        System.out.println(
                "================================================"
        );

        System.out.println(
                "ZYPHORA EMAIL OTP CREATED"
        );

        System.out.println(
                "Email: "
                        + normalizedEmail
        );

        System.out.println(
                "OTP: "
                        + otp
        );

        System.out.println(
                "Expires: "
                        + expiry
        );

        System.out.println(
                "================================================"
        );
    }


    // ============================================================
    // VERIFY OTP
    // ============================================================

    public User verifyOtp(
            String email,
            String otp
    ) {

        String normalizedEmail =
                normalize(email);


        // --------------------------------------------------------
        // NORMALIZE OTP
        // --------------------------------------------------------

        String submittedOtp =
                otp == null
                        ? ""
                        : otp.trim();


        // --------------------------------------------------------
        // VALIDATE OTP FORMAT
        // --------------------------------------------------------

        if (!submittedOtp.matches("\\d{6}")) {

            throw new IllegalArgumentException(
                    "OTP must be exactly 6 digits"
            );
        }


        // --------------------------------------------------------
        // FIND STORED OTP
        // --------------------------------------------------------

        PendingOtp current =
                pending.get(normalizedEmail);


        if (current == null) {

            throw new IllegalArgumentException(
                    "No pending OTP found. Please request a new OTP"
            );
        }


        // --------------------------------------------------------
        // CHECK EXPIRY
        // --------------------------------------------------------

        if (current.expiry()
                .isBefore(LocalDateTime.now())) {

            pending.remove(
                    normalizedEmail
            );

            throw new IllegalArgumentException(
                    "OTP has expired. Please request a new OTP"
            );
        }


        // --------------------------------------------------------
        // DEBUG LOG
        //
        // TEMPORARY — remove after confirming the issue.
        // --------------------------------------------------------

        System.out.println(
                "================================================"
        );

        System.out.println(
                "ZYPHORA EMAIL OTP VERIFICATION"
        );

        System.out.println(
                "Email: "
                        + normalizedEmail
        );

        System.out.println(
                "Stored OTP: "
                        + current.otp()
        );

        System.out.println(
                "Submitted OTP: "
                        + submittedOtp
        );

        System.out.println(
                "Attempts: "
                        + current.attempts()
        );

        System.out.println(
                "Expires: "
                        + current.expiry()
        );

        System.out.println(
                "================================================"
        );


        // --------------------------------------------------------
        // COMPARE OTP
        // --------------------------------------------------------

        if (!current.otp()
                .equals(submittedOtp)) {

            int attempts =
                    current.attempts() + 1;


            if (attempts >= MAX_ATTEMPTS) {

                pending.remove(
                        normalizedEmail
                );

                throw new IllegalArgumentException(
                        "Too many incorrect attempts. "
                                + "Please request a new OTP"
                );
            }


            pending.put(
                    normalizedEmail,
                    current.withAttempts(
                            attempts
                    )
            );


            throw new IllegalArgumentException(
                    "Invalid OTP. Please check the code and try again"
            );
        }


        // --------------------------------------------------------
        // OTP IS CORRECT
        // --------------------------------------------------------

        User user =
                userRepository
                        .findByEmail(normalizedEmail)
                        .orElseGet(
                                () -> createUser(
                                        normalizedEmail
                                )
                        );


        // --------------------------------------------------------
        // DELETE OTP AFTER SUCCESS
        // --------------------------------------------------------

        pending.remove(
                normalizedEmail
        );


        return user;
    }


    // ============================================================
    // CREATE USER FOR EMAIL LOGIN
    // ============================================================

    private User createUser(
            String email
    ) {

        String local =
                email.substring(
                        0,
                        email.indexOf('@')
                )
                .replaceAll(
                        "[^a-zA-Z0-9._-]",
                        ""
                );


        if (local.length() < 3) {
            local = "zyphorauser";
        }


        local =
                local.substring(
                        0,
                        Math.min(
                                30,
                                local.length()
                        )
                );


        String username = local;

        int suffix = 1;


        while (
                userRepository
                        .existsByUsername(username)
        ) {

            String extra =
                    "_" + suffix++;


            username =
                    local.substring(
                            0,
                            Math.min(
                                    50 - extra.length(),
                                    local.length()
                            )
                    )
                    + extra;
        }


        User user = new User();

        user.setEmail(email);

        user.setUsername(username);

        user.setPassword(
                passwordEncoder.encode(
                        UUID.randomUUID().toString()
                )
        );

        user.setRole("USER");


        return userRepository.save(user);
    }


    // ============================================================
    // NORMALIZE EMAIL
    // ============================================================

    private String normalize(
            String email
    ) {

        if (
                email == null
                        || email.isBlank()
        ) {

            throw new IllegalArgumentException(
                    "Email is required"
            );
        }


        return email
                .trim()
                .toLowerCase();
    }


    // ============================================================
    // PENDING OTP
    // ============================================================

    private record PendingOtp(
            String otp,
            LocalDateTime expiry,
            LocalDateTime sentAt,
            int attempts
    ) {

        PendingOtp withAttempts(
                int value
        ) {

            return new PendingOtp(
                    otp,
                    expiry,
                    sentAt,
                    value
            );
        }
    }
}
