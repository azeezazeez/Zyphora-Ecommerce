package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AIChatService {

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:openai/gpt-oss-120b}")
    private String model;

    // ============================================================
    // MAIN CHAT METHOD
    // ============================================================

    public ChatResponse reply(String message) {

        // --------------------------------------------------------
        // Validate server configuration
        // --------------------------------------------------------

        if (apiKey == null || apiKey.isBlank()) {

            System.err.println(
                    "ZYPHORA AI ERROR: GROQ_API_KEY is missing."
            );

            throw new IllegalStateException(
                    "AI assistant is not configured on the server."
            );
        }

        if (message == null || message.isBlank()) {

            throw new IllegalArgumentException(
                    "Message cannot be empty."
            );
        }

        String cleanMessage =
                message.trim();

        // --------------------------------------------------------
        // Request body
        // --------------------------------------------------------

        Map<String, Object> body =
                Map.of(
                        "model",
                        model,

                        "messages",
                        List.of(

                                Map.of(
                                        "role",
                                        "system",

                                        "content",
                                        """
                                        You are Zyphora's helpful AI shopping assistant.

                                        Zyphora is an online e-commerce shopping application.

                                        You can help customers with:
                                        - Products
                                        - Categories
                                        - Shopping recommendations
                                        - Cart usage
                                        - Orders
                                        - Delivery
                                        - Returns
                                        - Payments
                                        - Account usage
                                        - General shopping questions

                                        Important rules:

                                        1. Answer clearly and naturally.
                                        2. Keep answers concise and useful.
                                        3. Do not invent products, prices, stock availability,
                                           order status, delivery dates, policies, discounts,
                                           or account information.
                                        4. You do not have direct access to a customer's
                                           private account, cart, or order data.
                                        5. If the customer asks for live order/account
                                           information, tell them to open the appropriate
                                           Zyphora page or contact support.
                                        6. Never claim that an order was placed, cancelled,
                                           shipped, delivered, or refunded unless the system
                                           explicitly provides that information.
                                        7. For product recommendations, explain the relevant
                                           shopping considerations.
                                        8. Be friendly and professional.
                                        """
                                ),

                                Map.of(
                                        "role",
                                        "user",

                                        "content",
                                        cleanMessage
                                )
                        )
                );

        // --------------------------------------------------------
        // HTTP headers
        // --------------------------------------------------------

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
        );

        headers.setBearerAuth(
                apiKey.trim()
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(
                        body,
                        headers
                );

        // --------------------------------------------------------
        // Call Groq
        // --------------------------------------------------------

        try {

            System.out.println(
                    "Zyphora AI: Sending request to Groq..."
            );

            System.out.println(
                    "Zyphora AI: Model = " + model
            );

            ResponseEntity<Map> response =
                    restTemplate.exchange(
                            GROQ_URL,
                            HttpMethod.POST,
                            request,
                            Map.class
                    );

            // ----------------------------------------------------
            // Validate response
            // ----------------------------------------------------

            Map<?, ?> json =
                    response.getBody();

            if (json == null) {

                System.err.println(
                        "Zyphora AI ERROR: Groq returned an empty response."
                );

                throw new IllegalStateException(
                        "AI assistant returned an empty response."
                );
            }

            String text =
                    extractText(json);

            if (text == null || text.isBlank()) {

                System.err.println(
                        "Zyphora AI ERROR: Groq response did not contain assistant text."
                );

                System.err.println(
                        "Groq response: " + json
                );

                throw new IllegalStateException(
                        "AI assistant returned an empty response."
                );
            }

            System.out.println(
                    "Zyphora AI: Groq response received successfully."
            );

            return new ChatResponse(
                    text.trim()
            );

        } catch (HttpStatusCodeException exception) {

            int status =
                    exception
                            .getStatusCode()
                            .value();

            String responseBody =
                    exception.getResponseBodyAsString();

            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "ZYPHORA AI / GROQ ERROR"
            );

            System.err.println(
                    "HTTP Status: " + status
            );

            System.err.println(
                    "Groq Response: " +
                            safeLog(responseBody)
            );

            System.err.println(
                    "Model: " + model
            );

            System.err.println(
                    "================================================"
            );

            if (status == 401) {

                throw new IllegalStateException(
                        "AI provider authentication failed."
                );
            }

            if (status == 403) {

                throw new IllegalStateException(
                        "AI provider rejected the request."
                );
            }

            if (status == 429) {

                throw new IllegalStateException(
                        "AI provider rate limit reached. Please try again shortly."
                );
            }

            if (status >= 500) {

                throw new IllegalStateException(
                        "AI provider is temporarily unavailable."
                );
            }

            throw new IllegalStateException(
                    "AI provider rejected the request."
            );

        } catch (ResourceAccessException exception) {

            System.err.println(
                    "ZYPHORA AI NETWORK ERROR: " +
                            exception.getMessage()
            );

            throw new IllegalStateException(
                    "Unable to connect to the AI provider."
            );

        } catch (IllegalStateException exception) {

            throw exception;

        } catch (Exception exception) {

            System.err.println(
                    "ZYPHORA AI UNEXPECTED ERROR: " +
                            exception.getClass().getName()
            );

            System.err.println(
                    "Message: " +
                            exception.getMessage()
            );

            throw new IllegalStateException(
                    "AI assistant is temporarily unavailable."
            );
        }
    }

    // ============================================================
    // EXTRACT ASSISTANT TEXT
    // ============================================================

    private String extractText(
            Map<?, ?> json
    ) {

        Object choicesObject =
                json.get("choices");

        if (!(choicesObject instanceof List<?> choices)
                || choices.isEmpty()) {

            return null;
        }

        Object firstChoice =
                choices.get(0);

        if (!(firstChoice instanceof Map<?, ?> choice)) {

            return null;
        }

        Object messageObject =
                choice.get("message");

        if (!(messageObject instanceof Map<?, ?> message)) {

            return null;
        }

        Object content =
                message.get("content");

        if (content == null) {

            return null;
        }

        return content.toString();
    }

    // ============================================================
    // SAFE LOGGING
    // ============================================================

    private String safeLog(
            String value
    ) {

        if (value == null) {
            return "";
        }

        String cleaned =
                value
                        .replace("\n", " ")
                        .replace("\r", " ");

        if (cleaned.length() > 1000) {

            return cleaned.substring(
                    0,
                    1000
            ) + "...";
        }

        return cleaned;
    }
}
