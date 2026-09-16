package com.ecommerce.backend.service;

import com.ecommerce.backend.entity.Order;
import com.ecommerce.backend.entity.OrderItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class EmailService {

    private static final String BREVO_API_URL =
            "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${user.mail:}")
    private String senderEmail;

    @Value("${app.name:Zyphora}")
    private String appName;

    public EmailService() {
        this.restTemplate = new RestTemplate();
    }

    // ============================================================
    // SIGNUP OTP
    // ============================================================

    public void sendSignupOtp(
            String toEmail,
            String otp,
            String username) {

        String recipientName =
                username == null || username.isBlank()
                        ? "Zyphora User"
                        : username.trim();

        String subject =
                "Verify your " + getSafeAppName() + " account";

        String html =
                buildSignupOtpEmail(
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

    // ============================================================
    // PASSWORD RESET OTP
    // ============================================================

    public void sendOtp(
            String toEmail,
            String otp) {

        String subject =
                getSafeAppName() + " Password Reset OTP";

        String html =
                buildPasswordResetEmail(otp);

        sendEmail(
                toEmail,
                "Zyphora User",
                subject,
                html
        );
    }

    // ============================================================
    // ORDER CONFIRMATION
    // ============================================================

    public void sendOrderConfirmation(
            String toEmail,
            String username,
            Order order) {

        if (order == null) {
            throw new IllegalArgumentException(
                    "Order cannot be null."
            );
        }

        String recipientName =
                username == null || username.isBlank()
                        ? "Zyphora Customer"
                        : username.trim();

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

    // ============================================================
    // COMMON EMAIL SENDER
    // ============================================================

    private void sendEmail(
            String toEmail,
            String recipientName,
            String subject,
            String htmlContent) {

        String recipient =
                normalizeEmail(toEmail);

        String sender =
                normalizeEmail(senderEmail);

        if (recipient.isBlank()) {
            throw new IllegalArgumentException(
                    "Recipient email cannot be empty."
            );
        }

        if (!isValidEmail(recipient)) {
            throw new IllegalArgumentException(
                    "Invalid recipient email address."
            );
        }

        if (brevoApiKey == null
                || brevoApiKey.trim().isBlank()) {

            throw new IllegalStateException(
                    "BREVO_API_KEY is not configured in the backend environment."
            );
        }

        if (sender.isBlank()) {
            throw new IllegalStateException(
                    "USER_MAIL is not configured in the backend environment."
            );
        }

        if (!isValidEmail(sender)) {
            throw new IllegalStateException(
                    "USER_MAIL is not a valid email address."
            );
        }

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException(
                    "Email subject cannot be empty."
            );
        }

        if (htmlContent == null || htmlContent.isBlank()) {
            throw new IllegalArgumentException(
                    "Email HTML content cannot be empty."
            );
        }

        String apiKey =
                brevoApiKey.trim();

        System.out.println(
                "Zyphora email configuration: "
                        + "Brevo API key configured="
                        + !apiKey.isBlank()
                        + ", key length="
                        + apiKey.length()
                        + ", sender="
                        + sender
        );

        // ========================================================
        // BREVO REQUEST BODY
        // ========================================================

        Map<String, Object> senderObject =
                new HashMap<>();

        senderObject.put(
                "name",
                getSafeAppName()
        );

        senderObject.put(
                "email",
                sender
        );

        Map<String, Object> recipientObject =
                new HashMap<>();

        recipientObject.put(
                "email",
                recipient
        );

        recipientObject.put(
                "name",
                recipientName == null || recipientName.isBlank()
                        ? "Zyphora Customer"
                        : recipientName.trim()
        );

        Map<String, Object> requestBody =
                new HashMap<>();

        requestBody.put(
                "sender",
                senderObject
        );

        requestBody.put(
                "to",
                List.of(recipientObject)
        );

        requestBody.put(
                "subject",
                subject.trim()
        );

        requestBody.put(
                "htmlContent",
                htmlContent
        );

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.setAccept(
                List.of(MediaType.APPLICATION_JSON)
        );

        headers.set(
                "api-key",
                apiKey
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(
                        requestBody,
                        headers
                );

        // ========================================================
        // CALL BREVO
        // ========================================================

        try {

            System.out.println(
                    "Zyphora: Sending email through Brevo..."
            );

            System.out.println(
                    "Zyphora: Recipient="
                            + recipient
                            + ", Sender="
                            + sender
            );

            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            BREVO_API_URL,
                            request,
                            String.class
                    );

            System.out.println(
                    "================================================"
            );

            System.out.println(
                    "ZYPHORA EMAIL SENT SUCCESSFULLY"
            );

            System.out.println(
                    "Brevo HTTP Status: "
                            + response.getStatusCode().value()
            );

            System.out.println(
                    "Recipient: "
                            + recipient
            );

            System.out.println(
                    "================================================"
            );

        } catch (HttpStatusCodeException exception) {

            int status =
                    exception.getStatusCode().value();

            String responseBody =
                    exception.getResponseBodyAsString();

            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "BREVO API ERROR"
            );

            System.err.println(
                    "HTTP Status: "
                            + status
            );

            System.err.println(
                    "Response: "
                            + safeLog(responseBody)
            );

            System.err.println(
                    "================================================"
            );

            throw new IllegalStateException(
                    "Brevo email API returned HTTP "
                            + status
                            + ": "
                            + safeLog(responseBody),
                    exception
            );

        } catch (ResourceAccessException exception) {

            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "BREVO CONNECTION ERROR"
            );

            System.err.println(
                    "Could not connect to Brevo."
            );

            System.err.println(
                    "Reason: "
                            + exception.getMessage()
            );

            System.err.println(
                    "================================================"
            );

            throw new IllegalStateException(
                    "Could not connect to Brevo email service.",
                    exception
            );

        } catch (Exception exception) {

            System.err.println(
                    "================================================"
            );

            System.err.println(
                    "BREVO EMAIL ERROR"
            );

            System.err.println(
                    "Error type: "
                            + exception.getClass().getName()
            );

            System.err.println(
                    "Message: "
                            + exception.getMessage()
            );

            System.err.println(
                    "================================================"
            );

            throw new IllegalStateException(
                    "Failed to send email through Brevo.",
                    exception
            );
        }
    }

    // ============================================================
    // SIGNUP OTP EMAIL
    // ============================================================

    private String buildSignupOtpEmail(
            String username,
            String otp) {

        String safeUsername =
                escapeHtml(username);

        String safeOtp =
                escapeHtml(otp);

        String safeAppName =
                escapeHtml(getSafeAppName());

        /*
         * IMPORTANT:
         *
         * Do NOT use String.formatted() or %s placeholders here.
         *
         * HTML/CSS contains legitimate percentage values such as:
         *
         * width: 100%;
         *
         * Using formatted() with these values can cause:
         *
         * UnknownFormatConversionException: Conversion = ';'
         *
         * Unique placeholders are used instead.
         */

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Verify your account</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f5f7fb;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#172033;
                ">

                    <div style="
                        width:100%;
                        padding:30px 15px;
                        box-sizing:border-box;
                    ">

                        <div style="
                            max-width:600px;
                            margin:0 auto;
                            background:#ffffff;
                            border:1px solid #e5e7eb;
                            border-radius:18px;
                            overflow:hidden;
                        ">

                            <div style="
                                padding:32px 20px;
                                text-align:center;
                                background:linear-gradient(
                                    135deg,
                                    #fce7f3,
                                    #dbeafe
                                );
                            ">

                                <div style="
                                    width:52px;
                                    height:52px;
                                    line-height:52px;
                                    margin:0 auto;
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
                                    line-height:1.3;
                                    color:#172033;
                                ">
                                    Welcome to {{APP_NAME}}
                                </h1>

                            </div>

                            <div style="
                                padding:32px 25px;
                            ">

                                <h2 style="
                                    margin:0 0 16px;
                                    font-size:21px;
                                    color:#172033;
                                ">
                                    Verify your email
                                </h2>

                                <p style="
                                    margin:0 0 15px;
                                    color:#667085;
                                    font-size:15px;
                                    line-height:1.7;
                                ">
                                    Hi {{USERNAME}},
                                </p>

                                <p style="
                                    margin:0;
                                    color:#667085;
                                    font-size:15px;
                                    line-height:1.7;
                                ">
                                    Thank you for creating your
                                    {{APP_NAME}} account.
                                    Enter the verification code below to
                                    complete your registration.
                                </p>

                                <div style="
                                    margin:28px 0;
                                    padding:24px 15px;
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
                                        font-size:34px;
                                        font-weight:800;
                                        letter-spacing:7px;
                                        word-break:break-all;
                                    ">
                                        {{OTP}}
                                    </div>

                                </div>

                                <p style="
                                    margin:0;
                                    color:#94a3b8;
                                    font-size:13px;
                                    line-height:1.6;
                                ">
                                    This OTP expires in 5 minutes.
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
                                © {{APP_NAME}}. All rights reserved.
                            </div>

                        </div>

                    </div>

                </body>
                </html>
                """
                .replace(
                        "{{APP_NAME}}",
                        safeAppName
                )
                .replace(
                        "{{USERNAME}}",
                        safeUsername
                )
                .replace(
                        "{{OTP}}",
                        safeOtp
                );
    }

    // ============================================================
    // PASSWORD RESET EMAIL
    // ============================================================

    private String buildPasswordResetEmail(
            String otp) {

        String safeOtp =
                escapeHtml(otp);

        String safeAppName =
                escapeHtml(getSafeAppName());

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f5f7fb;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#172033;
                ">

                    <div style="
                        width:100%;
                        padding:30px 15px;
                        box-sizing:border-box;
                    ">

                        <div style="
                            max-width:600px;
                            margin:0 auto;
                            background:#ffffff;
                            border:1px solid #e5e7eb;
                            border-radius:18px;
                            padding:30px 25px;
                            box-sizing:border-box;
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
                                line-height:1.3;
                                color:#172033;
                            ">
                                Reset your password
                            </h1>

                            <p style="
                                margin:0;
                                color:#667085;
                                line-height:1.7;
                                font-size:15px;
                            ">
                                We received a request to reset your
                                {{APP_NAME}} account password.
                            </p>

                            <div style="
                                margin:28px 0;
                                padding:24px 15px;
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
                                    font-size:34px;
                                    font-weight:800;
                                    letter-spacing:7px;
                                    word-break:break-all;
                                ">
                                    {{OTP}}
                                </div>

                            </div>

                            <p style="
                                margin:0;
                                color:#94a3b8;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                This OTP expires in 5 minutes.
                                If you did not request a password reset,
                                please ignore this email.
                            </p>

                        </div>

                    </div>

                </body>
                </html>
                """
                .replace(
                        "{{APP_NAME}}",
                        safeAppName
                )
                .replace(
                        "{{OTP}}",
                        safeOtp
                );
    }

    // ============================================================
    // ORDER CONFIRMATION EMAIL
    // ============================================================

    private String buildOrderConfirmationEmail(
            String username,
            Order order) {

        String safeUsername =
                escapeHtml(username);

        String orderNumber =
                order.getOrderId() != null
                        ? order.getOrderId()
                        : String.valueOf(order.getId());

        String safeOrderNumber =
                escapeHtml(orderNumber);

        String orderDate =
                "N/A";

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

        String safeOrderDate =
                escapeHtml(orderDate);

        String status =
                order.getStatus() != null
                        ? order.getStatus().name()
                        : "PENDING";

        String safeStatus =
                escapeHtml(status);

        double total =
                order.getTotalAmount() != null
                        ? order.getTotalAmount()
                        : 0.0;

        StringBuilder itemsHtml =
                new StringBuilder();

        if (order.getItems() != null
                && !order.getItems().isEmpty()) {

            for (OrderItem item :
                    order.getItems()) {

                String productName =
                        item.getProductName() != null
                                ? item.getProductName()
                                : "Product";

                int quantity =
                        item.getQuantity() != null
                                ? item.getQuantity()
                                : 0;

                double subtotal =
                        item.getSubtotal() != null
                                ? item.getSubtotal()
                                : 0.0;

                itemsHtml
                        .append("<tr>")

                        .append("<td style=\"")
                        .append("padding:14px 8px;")
                        .append("border-bottom:1px solid #eef2f7;")
                        .append("color:#172033;")
                        .append("word-break:break-word;")
                        .append("\">")
                        .append(escapeHtml(productName))
                        .append("</td>")

                        .append("<td style=\"")
                        .append("padding:14px 8px;")
                        .append("text-align:center;")
                        .append("border-bottom:1px solid #eef2f7;")
                        .append("color:#667085;")
                        .append("\">")
                        .append(quantity)
                        .append("</td>")

                        .append("<td style=\"")
                        .append("padding:14px 8px;")
                        .append("text-align:right;")
                        .append("border-bottom:1px solid #eef2f7;")
                        .append("font-weight:600;")
                        .append("\">₹")
                        .append(
                                String.format(
                                        Locale.ENGLISH,
                                        "%.2f",
                                        subtotal
                                )
                        )
                        .append("</td>")

                        .append("</tr>");
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

        String safeAppName =
                escapeHtml(getSafeAppName());

        String formattedTotal =
                String.format(
                        Locale.ENGLISH,
                        "%.2f",
                        total
                );

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>Order Confirmation</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f5f7fb;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#172033;
                ">

                    <div style="
                        width:100%;
                        padding:30px 15px;
                        box-sizing:border-box;
                    ">

                        <div style="
                            max-width:650px;
                            margin:0 auto;
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
                                padding:32px 20px;
                                text-align:center;
                            ">

                                <div style="
                                    width:52px;
                                    height:52px;
                                    line-height:52px;
                                    text-align:center;
                                    margin:0 auto;
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
                                    line-height:1.3;
                                    color:#172033;
                                ">
                                    Order Confirmed
                                </h1>

                                <p style="
                                    margin:0;
                                    color:#475569;
                                    font-size:14px;
                                ">
                                    Thank you for shopping with {{APP_NAME}}.
                                </p>

                            </div>

                            <div style="
                                padding:32px 25px;
                                box-sizing:border-box;
                            ">

                                <p style="
                                    margin:0 0 15px;
                                    font-size:15px;
                                    line-height:1.7;
                                    color:#172033;
                                ">
                                    Hi {{USERNAME}},
                                </p>

                                <p style="
                                    margin:0;
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
                                    overflow:hidden;
                                ">

                                    <table
                                        width="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                        border="0"
                                        style="
                                            width:100%;
                                            border-collapse:collapse;
                                        ">

                                        <tr>

                                            <td style="
                                                padding:7px 0;
                                                color:#64748b;
                                                font-size:14px;
                                            ">
                                                Order ID
                                            </td>

                                            <td style="
                                                padding:7px 0;
                                                text-align:right;
                                                font-weight:700;
                                                font-size:14px;
                                                word-break:break-all;
                                            ">
                                                {{ORDER_ID}}
                                            </td>

                                        </tr>

                                        <tr>

                                            <td style="
                                                padding:7px 0;
                                                color:#64748b;
                                                font-size:14px;
                                            ">
                                                Date
                                            </td>

                                            <td style="
                                                padding:7px 0;
                                                text-align:right;
                                                font-size:14px;
                                            ">
                                                {{ORDER_DATE}}
                                            </td>

                                        </tr>

                                        <tr>

                                            <td style="
                                                padding:7px 0;
                                                color:#64748b;
                                                font-size:14px;
                                            ">
                                                Status
                                            </td>

                                            <td style="
                                                padding:7px 0;
                                                text-align:right;
                                                font-weight:700;
                                                color:#4f46e5;
                                                font-size:14px;
                                            ">
                                                {{STATUS}}
                                            </td>

                                        </tr>

                                    </table>

                                </div>

                                <h3 style="
                                    margin:28px 0 14px;
                                    font-size:17px;
                                    color:#172033;
                                ">
                                    Order Summary
                                </h3>

                                <div style="
                                    width:100%;
                                    overflow-x:auto;
                                ">

                                    <table
                                        width="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                        border="0"
                                        style="
                                            width:100%;
                                            min-width:400px;
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
                                            {{ITEMS}}
                                        </tbody>

                                    </table>

                                </div>

                                <div style="
                                    margin-top:20px;
                                    padding-top:18px;
                                    border-top:2px solid #e2e8f0;
                                    text-align:right;
                                ">

                                    <span style="
                                        color:#64748b;
                                        margin-right:8px;
                                        font-size:14px;
                                    ">
                                        Total
                                    </span>

                                    <strong style="
                                        font-size:23px;
                                        color:#4f46e5;
                                    ">
                                        ₹{{TOTAL}}
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
                                © {{APP_NAME}} · Thank you for choosing {{APP_NAME}}.
                            </div>

                        </div>

                    </div>

                </body>
                </html>
                """
                .replace(
                        "{{APP_NAME}}",
                        safeAppName
                )
                .replace(
                        "{{USERNAME}}",
                        safeUsername
                )
                .replace(
                        "{{ORDER_ID}}",
                        safeOrderNumber
                )
                .replace(
                        "{{ORDER_DATE}}",
                        safeOrderDate
                )
                .replace(
                        "{{STATUS}}",
                        safeStatus
                )
                .replace(
                        "{{ITEMS}}",
                        itemsHtml.toString()
                )
                .replace(
                        "{{TOTAL}}",
                        formattedTotal
                );
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private String getSafeAppName() {

        if (appName == null || appName.isBlank()) {
            return "Zyphora";
        }

        return appName.trim();
    }

    private String normalizeEmail(
            String email) {

        if (email == null) {
            return "";
        }

        return email.trim()
                .toLowerCase(Locale.ROOT);
    }

    private boolean isValidEmail(
            String email) {

        if (email == null || email.isBlank()) {
            return false;
        }

        return email.matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        );
    }

    private String safeLog(
            String value) {

        if (value == null || value.isBlank()) {
            return "(empty response)";
        }

        String cleaned =
                value.replace("\n", " ")
                        .replace("\r", " ")
                        .trim();

        if (cleaned.length() > 2000) {
            return cleaned.substring(0, 2000)
                    + "...";
        }

        return cleaned;
    }

    // ============================================================
    // HTML ESCAPING
    // ============================================================

    private String escapeHtml(
            String value) {

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
}
