package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String BREVO_URL =
            "https://api.brevo.com/v3/smtp/email";

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${user.mail}")
    private String senderEmail;

    @Value("${app.name:Zyphora}")
    private String appName;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends signup OTP email.
     */
    public void sendSignupOtp(
            String toEmail,
            String otp,
            String username
    ) {
        String subject = "Verify your " + appName + " account";

        String html = buildSignupOtpEmail(
                username,
                otp
        );

        sendEmail(
                toEmail,
                username,
                subject,
                html
        );
    }

    /**
     * Sends forgot-password OTP email.
     */
    public void sendOtp(
            String toEmail,
            String otp
    ) {
        String subject = appName + " Password Reset OTP";

        String html = buildPasswordResetEmail(otp);

        sendEmail(
                toEmail,
                "Zyphora User",
                subject,
                html
        );
    }

    /**
     * Sends order confirmation email.
     */
    public void sendOrderConfirmation(
            String toEmail,
            String username,
            Order order
    ) {
        String subject =
                appName + " Order Confirmation #" + order.getId();

        String html = buildOrderConfirmationEmail(
                username,
                order
        );

        sendEmail(
                toEmail,
                username,
                subject,
                html
        );
    }

    /**
     * Common Brevo email sender.
     */
    private void sendEmail(
            String toEmail,
            String recipientName,
            String subject,
            String htmlContent
    ) {

        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Recipient email cannot be empty"
            );
        }

        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException(
                    "BREVO_API_KEY is not configured"
            );
        }

        if (senderEmail == null || senderEmail.isBlank()) {
            throw new IllegalStateException(
                    "USER_MAIL is not configured"
            );
        }

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);
        headers.setAccept(
                List.of(MediaType.APPLICATION_JSON)
        );

        String safeRecipientName =
                recipientName == null || recipientName.isBlank()
                        ? "Zyphora Customer"
                        : recipientName;

        String requestBody = """
                {
                    "sender": {
                        "name": "%s",
                        "email": "%s"
                    },
                    "to": [
                        {
                            "email": "%s",
                            "name": "%s"
                        }
                    ],
                    "subject": "%s",
                    "htmlContent": "%s"
                }
                """.formatted(
                escapeJson(appName),
                escapeJson(senderEmail),
                escapeJson(toEmail),
                escapeJson(safeRecipientName),
                escapeJson(subject),
                escapeJson(htmlContent)
        );

        HttpEntity<String> request =
                new HttpEntity<>(
                        requestBody,
                        headers
                );

        try {

            restTemplate.postForEntity(
                    BREVO_URL,
                    request,
                    String.class
            );

            System.out.println(
                    "Email sent successfully to: " + toEmail
            );

        } catch (Exception e) {

            System.err.println(
                    "Failed to send email to " + toEmail
            );

            e.printStackTrace();

            throw new RuntimeException(
                    "Unable to send email",
                    e
            );
        }
    }

    /**
     * Signup OTP email.
     */
    private String buildSignupOtpEmail(
            String username,
            String otp
    ) {

        String safeUsername =
                escapeHtml(
                        username == null
                                ? "there"
                                : username
                );

        String safeOtp =
                escapeHtml(otp);

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Verify your Zyphora account</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f6f8fb;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#172033;
                ">

                    <div style="
                        max-width:600px;
                        margin:40px auto;
                        padding:20px;
                    ">

                        <div style="
                            background:#ffffff;
                            border:1px solid #e5e7eb;
                            border-radius:18px;
                            overflow:hidden;
                            box-shadow:0 10px 30px rgba(23,32,51,0.08);
                        ">

                            <div style="
                                background:linear-gradient(
                                    135deg,
                                    #e9d5ff,
                                    #dbeafe
                                );
                                padding:28px;
                                text-align:center;
                            ">

                                <div style="
                                    display:inline-flex;
                                    width:48px;
                                    height:48px;
                                    align-items:center;
                                    justify-content:center;
                                    background:#ffffff;
                                    border-radius:14px;
                                    font-size:24px;
                                    font-weight:800;
                                    color:#4f46e5;
                                ">
                                    Z
                                </div>

                                <h1 style="
                                    margin:16px 0 0;
                                    font-size:25px;
                                ">
                                    Welcome to Zyphora
                                </h1>

                            </div>

                            <div style="padding:32px;">

                                <h2 style="
                                    margin-top:0;
                                    font-size:20px;
                                ">
                                    Verify your email
                                </h2>

                                <p style="
                                    font-size:15px;
                                    line-height:1.7;
                                    color:#667085;
                                ">
                                    Hi %s,
                                </p>

                                <p style="
                                    font-size:15px;
                                    line-height:1.7;
                                    color:#667085;
                                ">
                                    Thank you for creating your Zyphora
                                    account. Use the verification code below
                                    to complete your registration.
                                </p>

                                <div style="
                                    margin:28px 0;
                                    padding:20px;
                                    background:#f8fafc;
                                    border:1px dashed #cbd5e1;
                                    border-radius:12px;
                                    text-align:center;
                                ">

                                    <div style="
                                        font-size:12px;
                                        color:#64748b;
                                        text-transform:uppercase;
                                        letter-spacing:2px;
                                        margin-bottom:10px;
                                    ">
                                        Verification Code
                                    </div>

                                    <div style="
                                        font-size:34px;
                                        font-weight:800;
                                        letter-spacing:8px;
                                        color:#4f46e5;
                                    ">
                                        %s
                                    </div>

                                </div>

                                <p style="
                                    font-size:13px;
                                    line-height:1.6;
                                    color:#94a3b8;
                                ">
                                    If you did not create this account,
                                    you can safely ignore this email.
                                </p>

                            </div>

                            <div style="
                                padding:20px 32px;
                                border-top:1px solid #eef2f7;
                                text-align:center;
                                color:#94a3b8;
                                font-size:12px;
                            ">
                                © Zyphora. All rights reserved.
                            </div>

                        </div>

                    </div>

                </body>
                </html>
                """.formatted(
                safeUsername,
                safeOtp
        );
    }

    /**
     * Password reset email.
     */
    private String buildPasswordResetEmail(
            String otp
    ) {

        String safeOtp =
                escapeHtml(otp);

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Zyphora Password Reset</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f6f8fb;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#172033;
                ">

                    <div style="
                        max-width:600px;
                        margin:40px auto;
                        padding:20px;
                    ">

                        <div style="
                            background:#ffffff;
                            border:1px solid #e5e7eb;
                            border-radius:18px;
                            padding:32px;
                        ">

                            <div style="
                                width:48px;
                                height:48px;
                                line-height:48px;
                                text-align:center;
                                background:#eef2ff;
                                border-radius:14px;
                                color:#4f46e5;
                                font-size:24px;
                                font-weight:800;
                            ">
                                Z
                            </div>

                            <h1 style="
                                font-size:24px;
                                margin-bottom:12px;
                            ">
                                Reset your password
                            </h1>

                            <p style="
                                color:#667085;
                                line-height:1.7;
                            ">
                                We received a request to reset your
                                Zyphora account password.
                            </p>

                            <div style="
                                margin:28px 0;
                                padding:20px;
                                background:#f8fafc;
                                border-radius:12px;
                                text-align:center;
                            ">

                                <div style="
                                    font-size:12px;
                                    color:#64748b;
                                    margin-bottom:10px;
                                    text-transform:uppercase;
                                    letter-spacing:2px;
                                ">
                                    Reset Code
                                </div>

                                <div style="
                                    font-size:34px;
                                    font-weight:800;
                                    letter-spacing:8px;
                                    color:#4f46e5;
                                ">
                                    %s
                                </div>

                            </div>

                            <p style="
                                color:#94a3b8;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                If you did not request a password reset,
                                please ignore this email.
                            </p>

                        </div>

                    </div>

                </body>
                </html>
                """.formatted(
                safeOtp
        );
    }

    /**
     * Order confirmation email.
     */
    private String buildOrderConfirmationEmail(
            String username,
            Order order
    ) {

        String safeUsername =
                escapeHtml(
                        username == null
                                ? "Customer"
                                : username
                );

        StringBuilder itemsHtml =
                new StringBuilder();

        BigDecimal calculatedTotal =
                BigDecimal.ZERO;

        if (order.getItems() != null) {

            for (OrderItem item : order.getItems()) {

                String productName =
                        item.getProduct() != null
                                ? item.getProduct().getName()
                                : "Product";

                int quantity =
                        item.getQuantity();

                BigDecimal price =
                        item.getPrice() != null
                                ? item.getPrice()
                                : BigDecimal.ZERO;

                BigDecimal lineTotal =
                        price.multiply(
                                BigDecimal.valueOf(quantity)
                        );

                calculatedTotal =
                        calculatedTotal.add(lineTotal);

                itemsHtml.append("""
                        <tr>
                            <td style="
                                padding:12px 8px;
                                border-bottom:1px solid #eef2f7;
                                color:#172033;
                            ">
                                %s
                            </td>

                            <td style="
                                padding:12px 8px;
                                border-bottom:1px solid #eef2f7;
                                text-align:center;
                                color:#667085;
                            ">
                                %d
                            </td>

                            <td style="
                                padding:12px 8px;
                                border-bottom:1px solid #eef2f7;
                                text-align:right;
                                font-weight:600;
                            ">
                                ₹%s
                            </td>
                        </tr>
                        """.formatted(
                        escapeHtml(productName),
                        quantity,
                        lineTotal.toPlainString()
                );
            }
        }

        BigDecimal total =
                order.getTotalAmount() != null
                        ? order.getTotalAmount()
                        : calculatedTotal;

        String status =
                order.getStatus() != null
                        ? order.getStatus().toString()
                        : "PENDING";

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Zyphora Order Confirmation</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f6f8fb;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#172033;
                ">

                    <div style="
                        max-width:650px;
                        margin:40px auto;
                        padding:20px;
                    ">

                        <div style="
                            background:#ffffff;
                            border:1px solid #e5e7eb;
                            border-radius:18px;
                            overflow:hidden;
                            box-shadow:0 10px 30px rgba(23,32,51,0.08);
                        ">

                            <div style="
                                background:linear-gradient(
                                    135deg,
                                    #dbeafe,
                                    #fce7f3
                                );
                                padding:32px;
                            ">

                                <div style="
                                    width:48px;
                                    height:48px;
                                    line-height:48px;
                                    text-align:center;
                                    background:#ffffff;
                                    border-radius:14px;
                                    color:#4f46e5;
                                    font-size:24px;
                                    font-weight:800;
                                ">
                                    Z
                                </div>

                                <h1 style="
                                    margin:18px 0 8px;
                                    font-size:25px;
                                ">
                                    Order Confirmed
                                </h1>

                                <p style="
                                    margin:0;
                                    color:#475569;
                                ">
                                    Thank you for shopping with Zyphora.
                                </p>

                            </div>

                            <div style="padding:32px;">

                                <p style="
                                    font-size:15px;
                                    line-height:1.7;
                                ">
                                    Hi %s,
                                </p>

                                <p style="
                                    color:#667085;
                                    line-height:1.7;
                                ">
                                    Your order has been successfully placed.
                                    Here are your order details.
                                </p>

                                <div style="
                                    margin:24px 0;
                                    padding:18px;
                                    background:#f8fafc;
                                    border-radius:12px;
                                ">

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        margin-bottom:8px;
                                    ">
                                        <strong>Order ID</strong>
                                        <span>#ORD-%s</span>
                                    </div>

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                    ">
                                        <strong>Status</strong>
                                        <span>%s</span>
                                    </div>

                                </div>

                                <h3 style="
                                    font-size:16px;
                                    margin:28px 0 12px;
                                ">
                                    Order Summary
                                </h3>

                                <table style="
                                    width:100%%;
                                    border-collapse:collapse;
                                    font-size:14px;
                                ">

                                    <thead>
                                        <tr>
                                            <th style="
                                                padding:10px 8px;
                                                text-align:left;
                                                color:#64748b;
                                                border-bottom:1px solid #e2e8f0;
                                            ">
                                                Product
                                            </th>

                                            <th style="
                                                padding:10px 8px;
                                                text-align:center;
                                                color:#64748b;
                                                border-bottom:1px solid #e2e8f0;
                                            ">
                                                Qty
                                            </th>

                                            <th style="
                                                padding:10px 8px;
                                                text-align:right;
                                                color:#64748b;
                                                border-bottom:1px solid #e2e8f0;
                                            ">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        %s
                                    </tbody>

                                </table>

                                <div style="
                                    margin-top:20px;
                                    padding-top:18px;
                                    border-top:2px solid #e2e8f0;
                                    text-align:right;
                                ">

                                    <span style="
                                        color:#64748b;
                                        margin-right:10px;
                                    ">
                                        Total
                                    </span>

                                    <strong style="
                                        font-size:22px;
                                        color:#4f46e5;
                                    ">
                                        ₹%s
                                    </strong>

                                </div>

                            </div>

                            <div style="
                                padding:20px 32px;
                                border-top:1px solid #eef2f7;
                                text-align:center;
                                color:#94a3b8;
                                font-size:12px;
                            ">
                                Thank you for choosing Zyphora.
                            </div>

                        </div>

                    </div>

                </body>
                </html>
                """.formatted(
                safeUsername,
                escapeHtml(
                        String.valueOf(order.getId())
                ),
                escapeHtml(status),
                itemsHtml,
                total.toPlainString()
        );
    }

    private String escapeHtml(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeJson(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }
}
