package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.Order;
import com.ecommerce.backend.entity.OrderItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class EmailService {

    private static final String BREVO_API_URL =
            "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate;

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${user.mail}")
    private String senderEmail;

    @Value("${app.name:Zyphora}")
    private String appName;

    public EmailService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send signup verification OTP.
     */
    public void sendSignupOtp(
            String toEmail,
            String otp,
            String username
    ) {
        String recipientName =
                username == null || username.isBlank()
                        ? "Zyphora User"
                        : username;

        String subject = "Verify your " + appName + " account";

        String html = buildSignupOtpEmail(
                recipientName,
                otp
        );

        sendEmail(
                toEmail,
                recipientName,
                subject,
                html
        );
    }

    /**
     * Send forgot-password OTP.
     */
    public void sendOtp(
            String toEmail,
            String otp
    ) {
        String subject =
                appName + " Password Reset OTP";

        String html =
                buildPasswordResetEmail(otp);

        sendEmail(
                toEmail,
                "Zyphora User",
                subject,
                html
        );
    }

    /**
     * Send order confirmation.
     */
    public void sendOrderConfirmation(
            String toEmail,
            String username,
            Order order
    ) {
        String recipientName =
                username == null || username.isBlank()
                        ? "Zyphora Customer"
                        : username;

        String orderNumber =
                order.getOrderId() != null
                        ? order.getOrderId()
                        : String.valueOf(order.getId());

        String subject =
                "Order Confirmed - " + orderNumber;

        String html =
                buildOrderConfirmationEmail(
                        recipientName,
                        order
                );

        sendEmail(
                toEmail,
                recipientName,
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
                    "Recipient email cannot be empty."
            );
        }

        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException(
                    "BREVO_API_KEY is not configured."
            );
        }

        if (senderEmail == null || senderEmail.isBlank()) {
            throw new IllegalStateException(
                    "USER_MAIL is not configured."
            );
        }

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.set(
                "api-key",
                brevoApiKey
        );

        headers.setAccept(
                List.of(MediaType.APPLICATION_JSON)
        );

        String jsonBody = """
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
                escapeJson(
                        recipientName == null
                                ? "Zyphora Customer"
                                : recipientName
                ),
                escapeJson(subject),
                escapeJson(htmlContent)
        );

        HttpEntity<String> request =
                new HttpEntity<>(
                        jsonBody,
                        headers
                );

        try {

            restTemplate.postForEntity(
                    BREVO_API_URL,
                    request,
                    String.class
            );

            System.out.println(
                    "Zyphora email sent successfully to: "
                            + toEmail
            );

        } catch (Exception exception) {

            System.err.println(
                    "Failed to send Zyphora email to: "
                            + toEmail
            );

            exception.printStackTrace();

            throw new RuntimeException(
                    "Failed to send email through Brevo.",
                    exception
            );
        }
    }

    // =========================================================
    // SIGNUP OTP EMAIL
    // =========================================================

    private String buildSignupOtpEmail(
            String username,
            String otp
    ) {

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
                    background:#f5f7fb;
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
                    ">

                        <div style="
                            background:linear-gradient(
                                135deg,
                                #fce7f3,
                                #dbeafe
                            );
                            padding:32px;
                            text-align:center;
                        ">

                            <div style="
                                width:52px;
                                height:52px;
                                line-height:52px;
                                margin:auto;
                                background:#ffffff;
                                border-radius:15px;
                                color:#4f46e5;
                                font-size:26px;
                                font-weight:800;
                            ">
                                Z
                            </div>

                            <h1 style="
                                margin:16px 0 0;
                                font-size:26px;
                                color:#172033;
                            ">
                                Welcome to Zyphora
                            </h1>

                        </div>

                        <div style="
                            padding:32px;
                        ">

                            <h2 style="
                                margin:0 0 16px;
                                font-size:21px;
                            ">
                                Verify your email
                            </h2>

                            <p style="
                                color:#667085;
                                font-size:15px;
                                line-height:1.7;
                            ">
                                Hi %s,
                            </p>

                            <p style="
                                color:#667085;
                                font-size:15px;
                                line-height:1.7;
                            ">
                                Thank you for creating your Zyphora
                                account. Enter the verification code
                                below to complete your registration.
                            </p>

                            <div style="
                                margin:28px 0;
                                padding:24px;
                                background:#f8fafc;
                                border:1px dashed #cbd5e1;
                                border-radius:14px;
                                text-align:center;
                            ">

                                <div style="
                                    color:#64748b;
                                    font-size:11px;
                                    text-transform:uppercase;
                                    letter-spacing:2px;
                                    margin-bottom:12px;
                                ">
                                    Verification Code
                                </div>

                                <div style="
                                    color:#4f46e5;
                                    font-size:36px;
                                    font-weight:800;
                                    letter-spacing:8px;
                                ">
                                    %s
                                </div>

                            </div>

                            <p style="
                                color:#94a3b8;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                If you did not create this account,
                                you can safely ignore this email.
                            </p>

                        </div>

                        <div style="
                            padding:20px;
                            text-align:center;
                            border-top:1px solid #eef2f7;
                            color:#94a3b8;
                            font-size:12px;
                        ">
                            © %s. All rights reserved.
                        </div>

                    </div>

                </div>

                </body>
                </html>
                """.formatted(
                escapeHtml(username),
                escapeHtml(otp),
                escapeHtml(appName)
        );
    }

    // =========================================================
    // PASSWORD RESET EMAIL
    // =========================================================

    private String buildPasswordResetEmail(
            String otp
    ) {

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
                    background:#f5f7fb;
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
                            width:52px;
                            height:52px;
                            line-height:52px;
                            text-align:center;
                            background:#eef2ff;
                            border-radius:15px;
                            color:#4f46e5;
                            font-size:26px;
                            font-weight:800;
                        ">
                            Z
                        </div>

                        <h1 style="
                            margin:20px 0 10px;
                            font-size:25px;
                        ">
                            Reset your password
                        </h1>

                        <p style="
                            color:#667085;
                            line-height:1.7;
                            font-size:15px;
                        ">
                            We received a request to reset your
                            Zyphora account password.
                        </p>

                        <div style="
                            margin:28px 0;
                            padding:24px;
                            background:#f8fafc;
                            border-radius:14px;
                            text-align:center;
                        ">

                            <div style="
                                color:#64748b;
                                font-size:11px;
                                text-transform:uppercase;
                                letter-spacing:2px;
                                margin-bottom:12px;
                            ">
                                Password Reset Code
                            </div>

                            <div style="
                                color:#4f46e5;
                                font-size:36px;
                                font-weight:800;
                                letter-spacing:8px;
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
                escapeHtml(otp)
        );
    }

    // =========================================================
    // ORDER CONFIRMATION EMAIL
    // =========================================================

    private String buildOrderConfirmationEmail(
            String username,
            Order order
    ) {

        String orderNumber =
                order.getOrderId() != null
                        ? order.getOrderId()
                        : String.valueOf(order.getId());

        String orderDate = "N/A";

        if (order.getOrderDate() != null) {

            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern(
                            "dd MMM yyyy, hh:mm a",
                            Locale.ENGLISH
                    );

            orderDate =
                    order.getOrderDate()
                            .format(formatter);
        }

        String status =
                order.getStatus() != null
                        ? order.getStatus().name()
                        : "PENDING";

        StringBuilder itemsHtml =
                new StringBuilder();

        if (order.getItems() != null
                && !order.getItems().isEmpty()) {

            for (OrderItem item : order.getItems()) {

                String productName =
                        item.getProductName() != null
                                ? item.getProductName()
                                : "Product";

                Integer quantity =
                        item.getQuantity() != null
                                ? item.getQuantity()
                                : 0;

                Double subtotal =
                        item.getSubtotal() != null
                                ? item.getSubtotal()
                                : 0.0;

                itemsHtml.append("""
                        <tr>
                            <td style="
                                padding:14px 8px;
                                border-bottom:1px solid #eef2f7;
                                color:#172033;
                            ">
                                %s
                            </td>

                            <td style="
                                padding:14px 8px;
                                text-align:center;
                                border-bottom:1px solid #eef2f7;
                                color:#667085;
                            ">
                                %d
                            </td>

                            <td style="
                                padding:14px 8px;
                                text-align:right;
                                border-bottom:1px solid #eef2f7;
                                font-weight:600;
                            ">
                                ₹%.2f
                            </td>
                        </tr>
                        """.formatted(
                        escapeHtml(productName),
                        quantity,
                        subtotal
                );
            }

        } else {

            itemsHtml.append("""
                    <tr>
                        <td colspan="3"
                            style="
                                padding:20px;
                                text-align:center;
                                color:#94a3b8;
                            ">
                            Order items unavailable
                        </td>
                    </tr>
                    """);
        }

        Double total =
                order.getTotalAmount() != null
                        ? order.getTotalAmount()
                        : 0.0;

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
                    background:#f5f7fb;
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
                                width:52px;
                                height:52px;
                                line-height:52px;
                                text-align:center;
                                background:#ffffff;
                                border-radius:15px;
                                color:#4f46e5;
                                font-size:26px;
                                font-weight:800;
                            ">
                                Z
                            </div>

                            <h1 style="
                                margin:18px 0 8px;
                                font-size:26px;
                            ">
                                Order Confirmed
                            </h1>

                            <p style="
                                margin:0;
                                color:#475569;
                                font-size:14px;
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
                                font-size:15px;
                            ">
                                Your order has been successfully placed.
                                Here are your order details.
                            </p>

                            <div style="
                                margin:24px 0;
                                padding:20px;
                                background:#f8fafc;
                                border-radius:14px;
                            ">

                                <table style="
                                    width:100%%;
                                    border-collapse:collapse;
                                ">

                                    <tr>
                                        <td style="
                                            padding:6px 0;
                                            color:#64748b;
                                        ">
                                            Order ID
                                        </td>

                                        <td style="
                                            padding:6px 0;
                                            text-align:right;
                                            font-weight:700;
                                        ">
                                            %s
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="
                                            padding:6px 0;
                                            color:#64748b;
                                        ">
                                            Date
                                        </td>

                                        <td style="
                                            padding:6px 0;
                                            text-align:right;
                                        ">
                                            %s
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="
                                            padding:6px 0;
                                            color:#64748b;
                                        ">
                                            Status
                                        </td>

                                        <td style="
                                            padding:6px 0;
                                            text-align:right;
                                            font-weight:700;
                                            color:#4f46e5;
                                        ">
                                            %s
                                        </td>
                                    </tr>

                                </table>

                            </div>

                            <h3 style="
                                margin:28px 0 14px;
                                font-size:17px;
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
                                    font-size:23px;
                                    color:#4f46e5;
                                ">
                                    ₹%.2f
                                </strong>

                            </div>

                        </div>

                        <div style="
                            padding:20px;
                            border-top:1px solid #eef2f7;
                            text-align:center;
                            color:#94a3b8;
                            font-size:12px;
                        ">
                            © %s · Thank you for choosing Zyphora.
                        </div>

                    </div>

                </div>

                </body>
                </html>
                """.formatted(
                escapeHtml(username),
                escapeHtml(orderNumber),
                escapeHtml(orderDate),
                escapeHtml(status),
                itemsHtml,
                total,
                escapeHtml(appName)
        );
    }

    // =========================================================
    // SECURITY / ESCAPING
    // =========================================================

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
