package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.client.secret}")
    private String googleClientSecret;

    @Value("${google.redirect.uri}")
    private String googleRedirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Exchanges the Google authorization code for a Google access token,
     * then retrieves the authenticated Google user's profile.
     */
    public User loginWithAuthorizationCode(String code) {

        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException(
                    "Google authorization code is required"
            );
        }

        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException(
                    "Google client ID is not configured on the server"
            );
        }

        if (googleClientSecret == null || googleClientSecret.isBlank()) {
            throw new IllegalStateException(
                    "Google client secret is not configured on the server"
            );
        }

        if (googleRedirectUri == null || googleRedirectUri.isBlank()) {
            throw new IllegalStateException(
                    "Google redirect URI is not configured on the server"
            );
        }

        // ============================================================
        // 1. Exchange authorization code for Google tokens
        // ============================================================

        String tokenUrl =
                "https://oauth2.googleapis.com/token";

        HttpHeaders tokenHeaders = new HttpHeaders();

        tokenHeaders.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        MultiValueMap<String, String> tokenBody =
                new LinkedMultiValueMap<>();

        tokenBody.add("code", code);
        tokenBody.add("client_id", googleClientId);
        tokenBody.add("client_secret", googleClientSecret);
        tokenBody.add("redirect_uri", googleRedirectUri);
        tokenBody.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> tokenRequest =
                new HttpEntity<>(
                        tokenBody,
                        tokenHeaders
                );

        Map<?, ?> tokenResponse;

        try {

            tokenResponse =
                    restTemplate.postForObject(
                            tokenUrl,
                            tokenRequest,
                            Map.class
                    );

        } catch (Exception e) {

            throw new IllegalArgumentException(
                    "Unable to exchange Google authorization code",
                    e
            );
        }

        if (tokenResponse == null) {
            throw new IllegalArgumentException(
                    "Google returned an empty token response"
            );
        }

        Object accessTokenObject =
                tokenResponse.get("access_token");

        if (accessTokenObject == null
                || String.valueOf(accessTokenObject).isBlank()) {

            throw new IllegalArgumentException(
                    "Google access token was not returned"
            );
        }

        String accessToken =
                String.valueOf(accessTokenObject);

        // ============================================================
        // 2. Retrieve Google user profile
        // ============================================================

        HttpHeaders profileHeaders =
                new HttpHeaders();

        profileHeaders.setBearerAuth(accessToken);

        HttpEntity<Void> profileRequest =
                new HttpEntity<>(profileHeaders);

        Map<?, ?> profile;

        try {

            profile =
                    restTemplate.exchange(
                            "https://openidconnect.googleapis.com/v1/userinfo",
                            HttpMethod.GET,
                            profileRequest,
                            Map.class
                    ).getBody();

        } catch (Exception e) {

            throw new IllegalArgumentException(
                    "Unable to retrieve Google user profile",
                    e
            );
        }

        if (profile == null) {
            throw new IllegalArgumentException(
                    "Google user profile was not returned"
            );
        }

        // ============================================================
        // 3. Validate Google email
        // ============================================================

        Object emailObject =
                profile.get("email");

        Object emailVerifiedObject =
                profile.get("email_verified");

        if (emailObject == null
                || String.valueOf(emailObject).isBlank()) {

            throw new IllegalArgumentException(
                    "Google account email was not provided"
            );
        }

        boolean emailVerified =
                Boolean.parseBoolean(
                        String.valueOf(emailVerifiedObject)
                );

        if (!emailVerified) {

            throw new IllegalArgumentException(
                    "Google account email could not be verified"
            );
        }

        String email =
                String.valueOf(emailObject)
                        .trim()
                        .toLowerCase();

        // ============================================================
        // 4. Get Google display name
        // ============================================================

        String name;

        if (profile.get("name") == null
                || String.valueOf(profile.get("name")).isBlank()) {

            name = "Zyphora User";

        } else {

            name =
                    String.valueOf(
                            profile.get("name")
                    ).trim();
        }

        // ============================================================
        // 5. Find existing user
        //    OR create a new Zyphora user
        // ============================================================

        return userRepository
                .findByEmail(email)
                .orElseGet(
                        () -> createUser(
                                email,
                                name
                        )
                );
    }

    /**
     * Creates a new Zyphora user for a Google account.
     */
    private User createUser(
            String email,
            String displayName) {

        String base =
                displayName
                        .replaceAll(
                                "[^a-zA-Z0-9._-]",
                                ""
                        )
                        .toLowerCase();

        if (base.length() < 3) {

            String emailUsername =
                    email.substring(
                            0,
                            email.indexOf('@')
                    );

            base =
                    emailUsername.replaceAll(
                            "[^a-zA-Z0-9._-]",
                            ""
                    );
        }

        if (base.length() < 3) {
            base = "zyphorauser";
        }

        base =
                base.substring(
                        0,
                        Math.min(
                                30,
                                base.length()
                        )
                );

        String username = base;

        int suffix = 1;

        while (
                userRepository.existsByUsername(username)
        ) {

            String extra =
                    "_" + suffix++;

            int maxBaseLength =
                    50 - extra.length();

            username =
                    base.substring(
                            0,
                            Math.min(
                                    maxBaseLength,
                                    base.length()
                            )
                    ) + extra;
        }

        User user = new User();

        user.setEmail(email);
        user.setUsername(username);

        /*
         * Google users do not provide a Zyphora password.
         * Generate a random password so the database password
         * field remains populated.
         */
        user.setPassword(
                passwordEncoder.encode(
                        UUID.randomUUID().toString()
                )
        );

        user.setRole("USER");

        return userRepository.save(user);
    }
}