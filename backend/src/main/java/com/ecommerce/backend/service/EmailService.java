package com.ecommerce.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${user.mail}")
    private String userEmail;

    @Value("${app.name:Zyphora}")
    private String appName;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendOtp(String toEmail, String otp) {

        String url = "https://api.brevo.com/v3/smtp/email";

        Map<String, Object> requestBody = Map.of(
                "sender", Map.of(
                        "name", appName,
                        "email", userEmail
                ),
                "to", new Object[]{
                        Map.of("email", toEmail)
                },
                "subject", "Reset Your " + appName + " Password",
                "htmlContent", buildOtpHtml(otp)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email via Brevo API", e);
        }
    }

    public void sendSignupOtp(String toEmail, String otp, String username) {
        String url = "https://api.brevo.com/v3/smtp/email";

        Map<String, Object> requestBody = Map.of(
                "sender", Map.of("name", appName, "email", userEmail),
                "to", new Object[]{Map.of("email", toEmail)},
                "subject", "Verify your " + appName + " account",
                "htmlContent", buildSignupOtpHtml(otp, username)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);
        try {
            restTemplate.postForEntity(url, new HttpEntity<>(requestBody, headers), String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send signup OTP via Brevo API", e);
        }
    }

    public void sendOrderConfirmation(String toEmail, String username, com.ecommerce.backend.entity.Order order) {
        String url = "https://api.brevo.com/v3/smtp/email";
        Map<String, Object> requestBody = Map.of(
                "sender", Map.of("name", appName, "email", userEmail),
                "to", new Object[]{Map.of("email", toEmail)},
                "subject", "Order " + order.getOrderId() + " confirmed — " + appName,
                "htmlContent", buildOrderConfirmationHtml(username, order)
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);
        try {
            restTemplate.postForEntity(url, new HttpEntity<>(requestBody, headers), String.class);
        } catch (Exception e) {
            // Order persistence must not fail because an external email provider is unavailable.
            System.err.println("Order confirmation email failed for " + order.getOrderId() + ": " + e.getMessage());
        }
    }

    private String buildSignupOtpHtml(String username, String otp) {
        return """
            <div style="margin:0;background:#f6f7f9;padding:40px 16px;font-family:Arial,sans-serif;color:#172033;">
              <div style="max-width:620px;margin:auto;background:#fff;border:1px solid #e8ebf0;border-radius:24px;overflow:hidden;">
                <div style="padding:32px;text-align:center;border-bottom:1px solid #eef0f4;">
                  <div style="font-size:30px;font-weight:800;letter-spacing:4px;">%s</div>
                  <div style="margin-top:6px;font-size:11px;letter-spacing:3px;color:#7b8494;">PREMIUM COMMERCE</div>
                </div>
                <div style="padding:38px 34px;text-align:center;">
                  <h1 style="margin:0 0 12px;font-size:28px;">Verify your account</h1>
                  <p style="margin:0 auto 28px;max-width:470px;color:#667085;line-height:1.7;">Hi %s, use the one-time verification code below to finish creating your %s account. This code expires in 5 minutes.</p>
                  <div style="display:inline-block;background:#111827;color:#fff;border-radius:14px;padding:18px 28px;font-size:30px;font-weight:800;letter-spacing:9px;">%s</div>
                  <p style="margin:28px 0 0;color:#98a2b3;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
                </div>
              </div>
            </div>
            """.formatted(appName, username, appName, otp);
    }

    private String buildOrderConfirmationHtml(String username, com.ecommerce.backend.entity.Order order) {
        StringBuilder rows = new StringBuilder();
        if (order.getItems() != null) {
            for (com.ecommerce.backend.entity.OrderItem item : order.getItems()) {
                rows.append("<tr><td style='padding:14px 0;border-bottom:1px solid #eef0f4;'>")
                    .append(escapeHtml(item.getProductName()))
                    .append("</td><td style='padding:14px 0;border-bottom:1px solid #eef0f4;text-align:center;'>")
                    .append(item.getQuantity())
                    .append("</td><td style='padding:14px 0;border-bottom:1px solid #eef0f4;text-align:right;'>₹")
                    .append(String.format("%.2f", item.getSubtotal()))
                    .append("</td></tr>");
            }
        }
        return """
            <div style="margin:0;background:#f6f7f9;padding:40px 16px;font-family:Arial,sans-serif;color:#172033;">
              <div style="max-width:680px;margin:auto;background:#fff;border:1px solid #e8ebf0;border-radius:24px;overflow:hidden;">
                <div style="padding:30px 34px;background:#111827;color:#fff;display:flex;justify-content:space-between;align-items:center;">
                  <div><div style="font-size:25px;font-weight:800;letter-spacing:3px;">%s</div><div style="font-size:11px;letter-spacing:2px;opacity:.65;margin-top:5px;">ORDER CONFIRMATION</div></div>
                  <div style="font-size:12px;padding:8px 12px;border:1px solid rgba(255,255,255,.25);border-radius:999px;">%s</div>
                </div>
                <div style="padding:36px 34px;">
                  <h1 style="margin:0 0 10px;font-size:28px;">Thanks for your order, %s.</h1>
                  <p style="margin:0 0 28px;color:#667085;line-height:1.6;">Your order has been placed successfully. Here is a clean summary for your records.</p>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;">
                    <div style="padding:14px 16px;background:#f8fafc;border-radius:12px;min-width:150px;"><div style="font-size:11px;color:#98a2b3;text-transform:uppercase;letter-spacing:1px;">Order ID</div><div style="font-weight:700;margin-top:5px;">%s</div></div>
                    <div style="padding:14px 16px;background:#f8fafc;border-radius:12px;min-width:150px;"><div style="font-size:11px;color:#98a2b3;text-transform:uppercase;letter-spacing:1px;">Status</div><div style="font-weight:700;margin-top:5px;">%s</div></div>
                  </div>
                  <table style="width:100%%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="text-align:left;padding-bottom:10px;color:#98a2b3;font-size:11px;text-transform:uppercase;">Item</th><th style="padding-bottom:10px;color:#98a2b3;font-size:11px;text-transform:uppercase;">Qty</th><th style="text-align:right;padding-bottom:10px;color:#98a2b3;font-size:11px;text-transform:uppercase;">Amount</th></tr></thead><tbody>%s</tbody></table>
                  <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e8ebf0;display:flex;justify-content:space-between;font-size:18px;font-weight:800;"><span>Total</span><span>₹%.2f</span></div>
                  <p style="margin:28px 0 0;color:#98a2b3;font-size:12px;line-height:1.6;">This email is your order confirmation from %s. Please keep it for your records.</p>
                </div>
              </div>
            </div>
            """.formatted(appName, order.getStatus(), username, order.getOrderId(), order.getStatus(), rows, order.getTotalAmount(), appName);
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String buildOtpHtml(String otp) {
        return """
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5; padding:30px;">
                <div style="max-width:600px; background:white; border-radius:16px; padding:40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    
                    <div style="text-align:center; margin-bottom:30px;">
                        <h1 style="font-family: 'Times New Roman', serif; font-size:32px; font-weight:700; letter-spacing:-1px; color:#1a1a1a; margin:0;">
                            %s
                        </h1>
                        <p style="color:#666; font-size:14px; margin:5px; letter-spacing:1px;">
                            LUXURY REDEFINED
                        </p>
                    </div>
                    
                    <h2 style="color:#1a1a1a; font-size:24px; font-weight:500; text-align:center; margin-bottom:10px;">
                        Reset Your Password
                    </h2>
                    
                    <p style="color:#666; text-align:center; font-size:16px; line-height:1.6; margin-bottom:30px;">
                        Hello,<br>
                        We received a request to reset your password for your %s account.
                    </p>
                    
                    <div style="text-align:center; margin:40px 20px;">
                        <p style="color:#666; font-size:14px; margin-bottom:15px; letter-spacing:2px; text-align:center;">
                            YOUR VERIFICATION CODE
                        </p>
                        <div style="display:flex; justify-content:center; align-items:center;">
                            <span style="
                                font-family: 'Courier New', monospace;
                                font-size:24px;
                                font-weight:600;
                                letter-spacing:8px;
                                background:#1a1a1a;
                                color:white;
                                padding:15px;
                                border-radius:8px;
                                display:inline-block;
                                
                               ">
                                %s
                            </span>
                        </div>
                    </div>
                    
                    <div style="background:#f9f9f9; padding:20px; border-radius:12px; margin:30px 0; text-align:center;">
                        <p style="color:#666; text-align:center; font-size:14px; margin:0;">
                            ⏰ This OTP is valid for <strong style="color:#1a1a1a;">5 minutes</strong>
                        </p>
                    </div>
                    
                    <p style="color:#999; font-size:13px; text-align:center; margin:30px 0 20px;">
                        If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin:30px 0;" />
                    
                    <div style="text-align:center;">
                        <p style="font-size:12px; color:#aaa; margin:5px 0;">
                            © 2026 %s. All rights reserved.
                        </p>
                        <p style="font-size:12px; color:#aaa; margin:5px 0;">
                            Luxury fashion for the discerning individual
                        </p>
                    </div>
                    
                </div>
            </div>
            """.formatted(appName.toUpperCase(), appName, otp, appName);
    }
}
