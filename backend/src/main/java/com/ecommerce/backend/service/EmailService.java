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

    // ============================================================
    // BREVO API
    // ============================================================

    private static final String BREVO_API_URL =
            "https://api.brevo.com/v3/smtp/email";


    // ============================================================
    // DEPENDENCIES
    // ============================================================

    private final RestTemplate restTemplate;


    // ============================================================
    // CONFIGURATION
    // ============================================================

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${user.mail}")
    private String senderEmail;

    @Value("${app.name:Zyphora}")
    private String appName;


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

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
                        : username;

        String subject =
                "Verify your " + appName + " account";

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


    // ============================================================
    // COMMON BREVO EMAIL SENDER
    // ============================================================

    private void sendEmail(
            String toEmail,
            String recipientName,
            String subject,
            String htmlContent) {

        // --------------------------------------------------------
        // Validate recipient
        // --------------------------------------------------------

        if (toEmail == null || toEmail.isBlank()) {

            throw new IllegalArgumentException(
                    "Recipient email cannot be empty."
            );
        }


        // --------------------------------------------------------
        // Validate Brevo API key
        // --------------------------------------------------------

        if (brevoApiKey == null || brevoApiKey.isBlank()) {

            throw new IllegalStateException(
                    "BREVO_API_KEY is not configured."
            );
        }


        // --------------------------------------------------------
        // Validate sender
        // --------------------------------------------------------

        if (senderEmail == null || senderEmail.isBlank()) {

            throw new IllegalStateException(
                    "USER_MAIL is not configured."
            );
        }


        // --------------------------------------------------------
        // HTTP headers
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // Brevo JSON request
        // --------------------------------------------------------

        String jsonBody =
                "{"
                        + "\"sender\":{"
                        + "\"name\":\""
                        + escapeJson(appName)
                        + "\","
                        + "\"email\":\""
                        + escapeJson(senderEmail)
                        + "\""
                        + "},"
                        + "\"to\":[{"
                        + "\"email\":\""
                        + escapeJson(toEmail)
                        + "\","
                        + "\"name\":\""
                        + escapeJson(
                                recipientName == null
                                        ? "Zyphora Customer"
                                        : recipientName
                        )
                        + "\""
                        + "}],"
                        + "\"subject\":\""
                        + escapeJson(subject)
                        + "\","
                        + "\"htmlContent\":\""
                        + escapeJson(htmlContent)
                        + "\""
                        + "}";


        // --------------------------------------------------------
        // HTTP request
        // --------------------------------------------------------

        HttpEntity<String> request =
                new HttpEntity<>(
                        jsonBody,
                        headers
                );


        // --------------------------------------------------------
        // Send email
        // --------------------------------------------------------

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

            System.err.println(
                    "Brevo error: "
                            + exception.getMessage()
            );

            throw new RuntimeException(
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
                escapeHtml(appName);


        StringBuilder html =
                new StringBuilder();


        html.append("""
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
                """);


        html.append("""
                <div style="
                    width:100%;
                    padding:30px 15px;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
                <div style="
                    max-width:600px;
                    margin:0 auto;
                    background:#ffffff;
                    border:1px solid #e5e7eb;
                    border-radius:18px;
                    overflow:hidden;
                ">
                """);


        // --------------------------------------------------------
        // Header
        // --------------------------------------------------------

        html.append("""
                <div style="
                    padding:32px 20px;
                    text-align:center;
                    background:linear-gradient(
                        135deg,
                        #fce7f3,
                        #dbeafe
                    );
                ">
                """);


        html.append("""
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
                """);


        html.append("""
                <h1 style="
                    margin:16px 0 0;
                    font-size:26px;
                    line-height:1.3;
                    color:#172033;
                ">
                """);

        html.append("Welcome to ")
                .append(safeAppName);

        html.append("""
                </h1>
                </div>
                """);


        // --------------------------------------------------------
        // Content
        // --------------------------------------------------------

        html.append("""
                <div style="
                    padding:32px 25px;
                ">
                """);


        html.append("""
                <h2 style="
                    margin:0 0 16px;
                    font-size:21px;
                    color:#172033;
                ">
                    Verify your email
                </h2>
                """);


        html.append("""
                <p style="
                    margin:0 0 15px;
                    color:#667085;
                    font-size:15px;
                    line-height:1.7;
                ">
                    Hi 
                """);

        html.append(safeUsername);

        html.append("""
                ,
                </p>
                """);


        html.append("""
                <p style="
                    margin:0;
                    color:#667085;
                    font-size:15px;
                    line-height:1.7;
                ">
                    Thank you for creating your Zyphora account.
                    Enter the verification code below to complete
                    your registration.
                </p>
                """);


        // --------------------------------------------------------
        // OTP
        // --------------------------------------------------------

        html.append("""
                <div style="
                    margin:28px 0;
                    padding:24px 15px;
                    background:#f8fafc;
                    border:1px dashed #cbd5e1;
                    border-radius:14px;
                    text-align:center;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
                <div style="
                    color:#64748b;
                    font-size:11px;
                    text-transform:uppercase;
                    letter-spacing:2px;
                    margin-bottom:12px;
                ">
                    Verification Code
                </div>
                """);


        html.append("""
                <div style="
                    color:#4f46e5;
                    font-size:34px;
                    font-weight:800;
                    letter-spacing:7px;
                    word-break:break-all;
                ">
                """);

        html.append(safeOtp);

        html.append("""
                </div>
                </div>
                """);


        html.append("""
                <p style="
                    margin:0;
                    color:#94a3b8;
                    font-size:13px;
                    line-height:1.6;
                ">
                    If you did not create this account,
                    you can safely ignore this email.
                </p>
                </div>
                """);


        // --------------------------------------------------------
        // Footer
        // --------------------------------------------------------

        html.append("""
                <div style="
                    padding:20px;
                    text-align:center;
                    border-top:1px solid #eef2f7;
                    color:#94a3b8;
                    font-size:12px;
                ">
                © 
                """);

        html.append(safeAppName);

        html.append("""
                . All rights reserved.
                </div>
                """);


        html.append("""
                </div>
                </div>

                </body>
                </html>
                """);


        return html.toString();
    }


    // ============================================================
    // PASSWORD RESET EMAIL
    // ============================================================

    private String buildPasswordResetEmail(
            String otp) {

        String safeOtp =
                escapeHtml(otp);

        String safeAppName =
                escapeHtml(appName);


        StringBuilder html =
                new StringBuilder();


        html.append("""
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
                """);


        html.append("""
                <div style="
                    width:100%;
                    padding:30px 15px;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
                <div style="
                    max-width:600px;
                    margin:0 auto;
                    background:#ffffff;
                    border:1px solid #e5e7eb;
                    border-radius:18px;
                    padding:30px 25px;
                    box-sizing:border-box;
                ">
                """);


        // --------------------------------------------------------
        // Logo
        // --------------------------------------------------------

        html.append("""
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
                """);


        html.append("""
                <h1 style="
                    margin:20px 0 10px;
                    font-size:25px;
                    line-height:1.3;
                    color:#172033;
                ">
                    Reset your password
                </h1>
                """);


        html.append("""
                <p style="
                    margin:0;
                    color:#667085;
                    line-height:1.7;
                    font-size:15px;
                ">
                    We received a request to reset your
                    Zyphora account password.
                </p>
                """);


        // --------------------------------------------------------
        // OTP
        // --------------------------------------------------------

        html.append("""
                <div style="
                    margin:28px 0;
                    padding:24px 15px;
                    background:#f8fafc;
                    border-radius:14px;
                    text-align:center;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
                <div style="
                    color:#64748b;
                    font-size:11px;
                    text-transform:uppercase;
                    letter-spacing:2px;
                    margin-bottom:12px;
                ">
                    Password Reset Code
                </div>
                """);


        html.append("""
                <div style="
                    color:#4f46e5;
                    font-size:34px;
                    font-weight:800;
                    letter-spacing:7px;
                    word-break:break-all;
                ">
                """);

        html.append(safeOtp);

        html.append("""
                </div>
                </div>
                """);


        html.append("""
                <p style="
                    margin:0;
                    color:#94a3b8;
                    font-size:13px;
                    line-height:1.6;
                ">
                    If you did not request a password reset,
                    please ignore this email.
                </p>
                """);


        html.append("""
                </div>
                </div>

                </body>
                </html>
                """);


        return html.toString();
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


        // --------------------------------------------------------
        // Order date
        // --------------------------------------------------------

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


        String safeOrderDate =
                escapeHtml(orderDate);


        // --------------------------------------------------------
        // Order status
        // --------------------------------------------------------

        String status =
                order.getStatus() != null
                        ? order.getStatus().name()
                        : "PENDING";

        String safeStatus =
                escapeHtml(status);


        // --------------------------------------------------------
        // Total
        // --------------------------------------------------------

        Double total =
                order.getTotalAmount() != null
                        ? order.getTotalAmount()
                        : 0.0;


        // --------------------------------------------------------
        // Build order items
        // --------------------------------------------------------

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
                                word-break:break-word;
                            ">
                        """);


                itemsHtml.append(
                        escapeHtml(productName)
                );


                itemsHtml.append("""
                            </td>

                            <td style="
                                padding:14px 8px;
                                text-align:center;
                                border-bottom:1px solid #eef2f7;
                                color:#667085;
                                white-space:nowrap;
                            ">
                        """);


                itemsHtml.append(quantity);


                itemsHtml.append("""
                            </td>

                            <td style="
                                padding:14px 8px;
                                text-align:right;
                                border-bottom:1px solid #eef2f7;
                                font-weight:600;
                                white-space:nowrap;
                            ">
                            ₹
                        """);


                itemsHtml.append(
                        String.format(
                                Locale.ENGLISH,
                                "%.2f",
                                subtotal
                        )
                );


                itemsHtml.append("""
                            </td>
                        </tr>
                        """);
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


        // ========================================================
        // BUILD COMPLETE EMAIL
        // ========================================================

        StringBuilder html =
                new StringBuilder();


        html.append("""
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
                """);


        html.append("""
                <div style="
                    width:100%;
                    padding:30px 15px;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
                <div style="
                    max-width:650px;
                    margin:0 auto;
                    background:#ffffff;
                    border:1px solid #e5e7eb;
                    border-radius:18px;
                    overflow:hidden;
                ">
                """);


        // ========================================================
        // HEADER
        // ========================================================

        html.append("""
                <div style="
                    background:linear-gradient(
                        135deg,
                        #dbeafe,
                        #fce7f3
                    );
                    padding:32px 20px;
                ">
                """);


        html.append("""
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
                """);


        html.append("""
                <h1 style="
                    margin:18px 0 8px;
                    font-size:26px;
                    line-height:1.3;
                    color:#172033;
                ">
                    Order Confirmed
                </h1>
                """);


        html.append("""
                <p style="
                    margin:0;
                    color:#475569;
                    font-size:14px;
                    line-height:1.5;
                ">
                    Thank you for shopping with Zyphora.
                </p>
                </div>
                """);


        // ========================================================
        // CONTENT
        // ========================================================

        html.append("""
                <div style="
                    padding:32px 25px;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
                <p style="
                    margin:0 0 15px;
                    font-size:15px;
                    line-height:1.7;
                    color:#172033;
                ">
                    Hi 
                """);

        html.append(safeUsername);

        html.append("""
                ,
                </p>
                """);


        html.append("""
                <p style="
                    margin:0;
                    color:#667085;
                    line-height:1.7;
                    font-size:15px;
                ">
                    Your order has been successfully placed.
                    Here are your order details.
                </p>
                """);


        // ========================================================
        // ORDER INFORMATION
        // ========================================================

        html.append("""
                <div style="
                    margin:24px 0;
                    padding:20px;
                    background:#f8fafc;
                    border-radius:14px;
                    box-sizing:border-box;
                    overflow:hidden;
                ">
                """);


        html.append("""
                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        width:100%;
                        border-collapse:collapse;
                    ">
                """);


        // Order ID

        html.append("""
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
                """);

        html.append(safeOrderNumber);

        html.append("""
                        </td>
                    </tr>
                """);


        // Date

        html.append("""
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
                """);

        html.append(safeOrderDate);

        html.append("""
                        </td>
                    </tr>
                """);


        // Status

        html.append("""
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
                """);

        html.append(safeStatus);

        html.append("""
                        </td>
                    </tr>
                </table>
                </div>
                """);


        // ========================================================
        // ORDER SUMMARY TITLE
        // ========================================================

        html.append("""
                <h3 style="
                    margin:28px 0 14px;
                    font-size:17px;
                    color:#172033;
                ">
                    Order Summary
                </h3>
                """);


        // ========================================================
        // ITEMS TABLE
        // ========================================================

        html.append("""
                <div style="
                    width:100%;
                    overflow-x:auto;
                    box-sizing:border-box;
                ">
                """);


        html.append("""
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
                """);


        html.append("""
                    <thead>
                        <tr>

                            <th style="
                                padding:10px 8px;
                                text-align:left;
                                color:#64748b;
                                border-bottom:1px solid #e2e8f0;
                                font-weight:600;
                            ">
                                Product
                            </th>

                            <th style="
                                padding:10px 8px;
                                text-align:center;
                                color:#64748b;
                                border-bottom:1px solid #e2e8f0;
                                font-weight:600;
                            ">
                                Qty
                            </th>

                            <th style="
                                padding:10px 8px;
                                text-align:right;
                                color:#64748b;
                                border-bottom:1px solid #e2e8f0;
                                font-weight:600;
                            ">
                                Amount
                            </th>

                        </tr>
                    </thead>

                    <tbody>
                """);


        html.append(itemsHtml);


        html.append("""
                    </tbody>
                </table>
                </div>
                """);


        // ========================================================
        // TOTAL
        // ========================================================

        html.append("""
                <div style="
                    margin-top:20px;
                    padding-top:18px;
                    border-top:2px solid #e2e8f0;
                    text-align:right;
                ">
                """);


        html.append("""
                <span style="
                    color:#64748b;
                    margin-right:8px;
                    font-size:14px;
                ">
                    Total
                </span>
                """);


        html.append("""
                <strong style="
                    font-size:23px;
                    color:#4f46e5;
                    white-space:nowrap;
                ">
                    ₹
                """);


        html.append(
                String.format(
                        Locale.ENGLISH,
                        "%.2f",
                        total
                )
        );


        html.append("""
                </strong>
                </div>
                """);


        html.append("""
                </div>
                """);


        // ========================================================
        // FOOTER
        // ========================================================

        html.append("""
                <div style="
                    padding:20px;
                    border-top:1px solid #eef2f7;
                    text-align:center;
                    color:#94a3b8;
                    font-size:12px;
                    line-height:1.6;
                ">
                © 
                """);


        html.append(
                escapeHtml(appName)
        );


        html.append("""
                · Thank you for choosing Zyphora.
                </div>
                """);


        // ========================================================
        // CLOSE HTML
        // ========================================================

        html.append("""
                </div>
                </div>

                </body>
                </html>
                """);


        return html.toString();
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


    // ============================================================
    // JSON ESCAPING
    // ============================================================

    private String escapeJson(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }
}
