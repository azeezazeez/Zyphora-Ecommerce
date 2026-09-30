package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
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

    private static final String GROQ_API_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:openai/gpt-oss-120b}")
    private String model;

    public ChatResponse reply(String message) {

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "AI chatbot is not configured on the server"
            );
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content",
                                        "You are Zyphora's helpful AI shopping assistant. "
                                                + "Answer customer questions clearly and naturally. "
                                                + "You can help with products, categories, shopping guidance, "
                                                + "orders, account usage, delivery, returns, payments, and general questions. "
                                                + "Do not invent order status, stock, prices, policies, or account information that you cannot access. "
                                                + "If a question requires live account/order data, tell the user to use the relevant Zyphora page or contact support. "
                                                + "Keep answers concise and useful."
                        ),
                        Map.of(
                                "role", "user",
                                "content", message.trim()
                        )
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(apiKey.trim());

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    GROQ_API_URL,
                    new HttpEntity<>(body, headers),
                    Map.class
            );

            Map<?, ?> json = response.getBody();
            String text = extractText(json);

            if (text == null || text.isBlank()) {
                throw new IllegalStateException(
                        "AI assistant returned an empty response"
                );
            }

            return new ChatResponse(text.trim());

        } catch (HttpStatusCodeException exception) {

            int status = exception.getStatusCode().value();

            System.err.println(
                    "GROQ API ERROR: HTTP " + status
            );

            // Never expose Groq's 401 as Zyphora's 401.
            // Otherwise the frontend may interpret it as an expired
            // Zyphora JWT and log the customer out.
            throw new IllegalStateException(
                    "AI provider request failed",
                    exception
            );

        } catch (ResourceAccessException exception) {

            System.err.println(
                    "GROQ CONNECTION ERROR: " + exception.getMessage()
            );

            throw new IllegalStateException(
                    "AI provider is temporarily unavailable",
                    exception
            );
        }
    }

    private String extractText(Map<?, ?> json) {

        if (json == null
                || !(json.get("choices") instanceof List<?> choices)
                || choices.isEmpty()) {
            return null;
        }

        Object choice = choices.get(0);

        if (!(choice instanceof Map<?, ?> choiceMap)) {
            return null;
        }

        Object message = choiceMap.get("message");

        if (!(message instanceof Map<?, ?> messageMap)) {
            return null;
        }

        Object content = messageMap.get("content");

        return content == null
                ? null
                : content.toString();
    }
}
