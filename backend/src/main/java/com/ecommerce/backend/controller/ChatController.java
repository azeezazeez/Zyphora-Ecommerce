package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.ChatRequest;
import com.ecommerce.backend.dto.ChatResponse;
import com.ecommerce.backend.service.AIChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/chat", "/api/ai/chat"})
@RequiredArgsConstructor
public class ChatController {

    private final AIChatService aiChatService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request) {

        try {
            String message = request.getMessage() == null
                    ? ""
                    : request.getMessage().trim();

            if (message.isBlank()) {
                return ResponseEntity
                        .badRequest()
                        .body(ApiResponse.<ChatResponse>error(
                                "Message cannot be empty"
                        ));
            }

            ChatResponse response = aiChatService.reply(message);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "AI response generated",
                            response
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<ChatResponse>error(
                            e.getMessage()
                    ));

        } catch (IllegalStateException e) {
            System.err.println(
                    "ZYPHORA AI CHAT ERROR: " + e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.<ChatResponse>error(
                            "Zyphora AI is temporarily unavailable. Please try again later."
                    ));
        }
    }
}
