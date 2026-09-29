package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AIChatService {
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:openai/gpt-oss-120b}")
    private String model;

    public ChatResponse reply(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI chatbot is not configured on the server");
        }

        String url = "https://api.groq.com/openai/v1/chat/completions";
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", "You are Zyphora's helpful AI shopping assistant. Answer customer questions clearly and naturally. You can help with products, categories, shopping guidance, orders, account usage, delivery, returns, payments, and general questions. Do not invent order status, stock, prices, policies, or account information that you cannot access. If a question requires live account/order data, tell the user to use the relevant Zyphora page or contact support. Keep answers concise and useful."
                        ),
                        Map.of("role", "user", "content", message)
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                url,
                new HttpEntity<>(body, headers),
                Map.class
        );

        Map<?, ?> json = response.getBody();
        String text = extractText(json);
        if (text == null || text.isBlank()) {
            throw new IllegalStateException("AI assistant returned an empty response");
        }

        return new ChatResponse(text.trim());
    }

    private String extractText(Map<?, ?> json) {
        if (json == null || !(json.get("choices") instanceof List<?> choices) || choices.isEmpty()) {
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
        return content == null ? null : content.toString();
    }
}
