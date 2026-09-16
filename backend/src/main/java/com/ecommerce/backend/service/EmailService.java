package com.ecommerce.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.ecommerce.backend.entity.Order;
import com.ecommerce.backend.entity.OrderItem;

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

    private static final String BREVO_URL =
            "https://api.brevo.com/v3/smtp/email";


    // ============================================================
    // SIGNUP OTP
    // ============================================================

    @Async
    public void sendSignupOtp(
            String toEmail,
            String otp,
            String username
    ) {

        if (toEmail == null || toEmail.isBlank()) {
            System.err.println(
                    "Signup OTP email skipped: recipient email is empty."
            );
            return;
        }

        try {

            String safeUsername =
                    username == null || username.isBlank()
                            ? "there"
                            : escapeHtml(username);

            Map<String, Object> requestBody =
                    Map.of(
                            "sender",
                            Map.of(
                                    "name", appName,
                                    "email", userEmail
                            ),

                            "to",
                            new Object[]{
                                    Map.of(
                                            "email",
                                            toEmail.trim()
                                    )
                            },

                            "subject",
                            "Verify your "
                                    + appName
                                    + " account",

                            "htmlContent",
                            buildSignupOtpHtml(
                                    otp,
                                    safeUsername
                            )
                    );

            sendThroughBrevo(requestBody);

        } catch (Exception e) {

            System.err.println(
                    "Failed to send signup OTP email: "
                            + e.getMessage()
            );

            /*
             * Do not expose Brevo/API errors to the frontend
             * from this asynchronous method.
             */
        }
    }


    // ============================================================
    // FORGOT PASSWORD OTP
    // ============================================================

    @Async
    public void sendOtp(
            String toEmail,
            String otp
    ) {

        if (toEmail == null || toEmail.isBlank()) {
            System.err.println(
                    "Password reset email skipped: "
                            + "recipient email is empty."
            );
            return;
        }

        try {

            Map<String, Object> requestBody =
                    Map.of(
                            "sender",
                            Map.of(
                                    "name", appName,
                                    "email", userEmail
                            ),

                            "to",
                            new Object[]{
                                    Map.of(
                                            "email",
                                            toEmail.trim()
                                    )
                            },

                            "subject",
                            "Reset Your "
                                    + appName
                                    + " Password",

                            "htmlContent",
                            buildPasswordResetHtml(otp)
                    );

            sendThroughBrevo(requestBody);

        } catch (Exception e) {

            System.err.println(
                    "Failed to send password reset email: "
                            + e.getMessage()
            );
        }
    }


    // ============================================================
    // ORDER CONFIRMATION
    // ============================================================

    @Async
    public void sendOrderConfirmation(
            String toEmail,
            String username,
            Order order
    ) {

        if (toEmail == null || toEmail.isBlank()) {

            System.err.println(
                    "Order confirmation skipped: "
                            + "recipient email is empty."
            );

            return;
        }

        if (order == null) {

            System.err.println(
                    "Order confirmation skipped: "
                            + "order is null."
            );

            return;
        }

        try {

            String customerName =
                    username == null || username.isBlank()
                            ? "Customer"
                            : escapeHtml(username);

            String orderId =
                    escapeHtml(order.getOrderId());

            String status =
                    order.getStatus() == null
                            ? "PENDING"
                            : order.getStatus()
                                .name();

            String html =
                    buildOrderConfirmationHtml(
                            customerName,
                            orderId,
                            status,
                            order
                    );

            Map<String, Object> requestBody =
                    Map.of(
                            "sender",
                            Map.of(
                                    "name", appName,
                                    "email", userEmail
                            ),

                            "to",
                            new Object[]{
                                    Map.of(
                                            "email",
                                            toEmail.trim()
                                    )
                            },

                            "subject",
                            "Order "
                                    + order.getOrderId()
                                    + " confirmed — "
                                    + appName,

                            "htmlContent",
                            html
                    );

            sendThroughBrevo(requestBody);

            System.out.println(
                    "Order confirmation email sent successfully: "
                            + toEmail
            );

        } catch (Exception e) {

            /*
             * IMPORTANT:
             *
             * The order has already been persisted.
             * An email provider failure must NEVER make
             * the order API fail.
             */

            System.err.println(
                    "Order confirmation email failed for "
                            + order.getOrderId()
                            + ": "
                            + e.getMessage()
            );
        }
    }


    // ============================================================
    // BREVO REQUEST
    // ============================================================

    private void sendThroughBrevo(
            Map<String, Object> requestBody
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.set(
                "api-key",
                brevoApiKey
        );

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(
                        requestBody,
                        headers
                );

        restTemplate.postForEntity(
                BREVO_URL,
                entity,
                String.class
        );
    }


    // ============================================================
    // SIGNUP OTP EMAIL
    // ============================================================

    private String buildSignupOtpHtml(
            String otp,
            String username
    ) {

        String safeOtp =
                escapeHtml(otp);

        String safeAppName =
                escapeHtml(appName);

        return """
                <!DOCTYPE html>

                <html lang="en">

                <head>

                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width,
                        initial-scale=1.0"
                    >

                    <meta
                        name="x-apple-disable-message-reformatting"
                    >

                    <title>
                        Verify your %s account
                    </title>

                </head>


                <body
                    style="
                        margin:0;
                        padding:0;
                        width:100%%;
                        background:#f3f4f7;
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                    "
                >

                    <table
                        role="presentation"
                        width="100%%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                            width:100%%;
                            background:#f3f4f7;
                        "
                    >

                        <tr>

                            <td
                                align="center"
                                style="
                                    padding:
                                        24px
                                        12px;
                                "
                            >

                                <table
                                    role="presentation"
                                    width="100%%"
                                    cellspacing="0"
                                    cellpadding="0"
                                    border="0"
                                    style="
                                        width:100%%;
                                        max-width:600px;
                                        background:#ffffff;
                                        border:
                                            1px solid
                                            #e5e7eb;
                                        border-radius:
                                            20px;
                                        overflow:hidden;
                                    "
                                >

                                    <!-- BRAND -->

                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    30px
                                                    20px
                                                    24px;
                                            "
                                        >

                                            <div
                                                style="
                                                    font-size:34px;
                                                    line-height:40px;
                                                    font-weight:700;
                                                    color:#101827;
                                                    letter-spacing:.5px;
                                                "
                                            >
                                                %s
                                            </div>

                                            <div
                                                style="
                                                    margin-top:6px;
                                                    font-size:9px;
                                                    line-height:14px;
                                                    font-weight:600;
                                                    color:#9aa3b2;
                                                    letter-spacing:3px;
                                                "
                                            >
                                                PREMIUM COMMERCE
                                            </div>

                                        </td>

                                    </tr>


                                    <!-- CONTENT -->

                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    38px
                                                    24px
                                                    42px;
                                            "
                                        >

                                            <h1
                                                style="
                                                    margin:
                                                        0
                                                        0
                                                        12px;
                                                    font-size:30px;
                                                    line-height:38px;
                                                    font-weight:700;
                                                    color:#101827;
                                                "
                                            >
                                                Verify your account
                                            </h1>


                                            <p
                                                style="
                                                    max-width:470px;
                                                    margin:
                                                        0
                                                        auto
                                                        28px;
                                                    font-size:15px;
                                                    line-height:25px;
                                                    color:#687385;
                                                "
                                            >
                                                Hi %s, use the one-time
                                                verification code below
                                                to finish creating your
                                                %s account.
                                            </p>


                                            <!-- OTP -->

                                            <div
                                                style="
                                                    display:inline-block;
                                                    padding:
                                                        17px
                                                        25px;
                                                    background:#101827;
                                                    border-radius:14px;
                                                    color:#ffffff;
                                                    font-size:30px;
                                                    line-height:38px;
                                                    font-weight:800;
                                                    letter-spacing:9px;
                                                "
                                            >
                                                %s
                                            </div>


                                            <p
                                                style="
                                                    margin:
                                                        22px
                                                        0
                                                        0;
                                                    font-size:13px;
                                                    line-height:20px;
                                                    color:#98a2b3;
                                                "
                                            >
                                                This code expires in
                                                <strong
                                                    style="
                                                        color:#475467;
                                                    "
                                                >
                                                    5 minutes
                                                </strong>.
                                            </p>


                                            <div
                                                style="
                                                    margin-top:28px;
                                                    padding:
                                                        14px
                                                        16px;
                                                    background:#f8fafc;
                                                    border-radius:12px;
                                                    font-size:12px;
                                                    line-height:19px;
                                                    color:#98a2b3;
                                                "
                                            >
                                                If you did not request
                                                this verification,
                                                you can safely ignore
                                                this email.
                                            </div>

                                        </td>

                                    </tr>


                                    <!-- FOOTER -->

                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    18px
                                                    20px;
                                                background:#f8fafc;
                                                border-top:
                                                    1px solid
                                                    #edf0f4;
                                            "
                                        >

                                            <div
                                                style="
                                                    font-size:11px;
                                                    line-height:18px;
                                                    color:#9aa3b2;
                                                "
                                            >
                                                © 2026 %s.
                                                All rights reserved.
                                            </div>

                                        </td>

                                    </tr>

                                </table>

                            </td>

                        </tr>

                    </table>

                </body>

                </html>
                """.formatted(
                safeAppName,
                safeAppName,
                username,
                safeAppName,
                safeOtp,
                safeAppName
        );
    }


    // ============================================================
    // PASSWORD RESET EMAIL
    // ============================================================

    private String buildPasswordResetHtml(
            String otp
    ) {

        String safeOtp =
                escapeHtml(otp);

        String safeAppName =
                escapeHtml(appName);

        return """
                <!DOCTYPE html>

                <html lang="en">

                <head>

                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width,
                        initial-scale=1.0"
                    >

                </head>

                <body
                    style="
                        margin:0;
                        padding:0;
                        background:#f3f4f7;
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                    "
                >

                    <table
                        role="presentation"
                        width="100%%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                    >

                        <tr>

                            <td
                                align="center"
                                style="
                                    padding:
                                        24px
                                        12px;
                                "
                            >

                                <table
                                    role="presentation"
                                    width="100%%"
                                    cellspacing="0"
                                    cellpadding="0"
                                    border="0"
                                    style="
                                        max-width:600px;
                                        background:#ffffff;
                                        border-radius:20px;
                                        border:
                                            1px solid
                                            #e5e7eb;
                                    "
                                >

                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    32px
                                                    20px;
                                            "
                                        >

                                            <div
                                                style="
                                                    font-size:32px;
                                                    font-weight:700;
                                                    color:#101827;
                                                "
                                            >
                                                %s
                                            </div>

                                            <div
                                                style="
                                                    margin-top:6px;
                                                    font-size:9px;
                                                    letter-spacing:3px;
                                                    color:#98a2b3;
                                                "
                                            >
                                                PREMIUM COMMERCE
                                            </div>

                                        </td>

                                    </tr>


                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    30px
                                                    24px
                                                    40px;
                                            "
                                        >

                                            <h1
                                                style="
                                                    margin:0 0 12px;
                                                    font-size:28px;
                                                    color:#101827;
                                                "
                                            >
                                                Reset your password
                                            </h1>

                                            <p
                                                style="
                                                    margin:
                                                        0
                                                        auto
                                                        28px;
                                                    max-width:470px;
                                                    font-size:15px;
                                                    line-height:25px;
                                                    color:#687385;
                                                "
                                            >
                                                We received a request
                                                to reset your %s
                                                account password.
                                            </p>

                                            <div
                                                style="
                                                    display:inline-block;
                                                    padding:
                                                        17px
                                                        25px;
                                                    background:#101827;
                                                    border-radius:14px;
                                                    color:#ffffff;
                                                    font-size:30px;
                                                    line-height:38px;
                                                    font-weight:800;
                                                    letter-spacing:9px;
                                                "
                                            >
                                                %s
                                            </div>

                                            <p
                                                style="
                                                    margin:
                                                        22px
                                                        0
                                                        0;
                                                    font-size:13px;
                                                    color:#98a2b3;
                                                "
                                            >
                                                This code expires in
                                                <strong
                                                    style="
                                                        color:#475467;
                                                    "
                                                >
                                                    5 minutes
                                                </strong>.
                                            </p>

                                            <p
                                                style="
                                                    margin:
                                                        28px
                                                        0
                                                        0;
                                                    font-size:12px;
                                                    line-height:19px;
                                                    color:#98a2b3;
                                                "
                                            >
                                                If you did not request
                                                this password reset,
                                                please ignore this email.
                                            </p>

                                        </td>

                                    </tr>


                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    18px;
                                                background:#f8fafc;
                                                border-top:
                                                    1px solid
                                                    #edf0f4;
                                            "
                                        >

                                            <span
                                                style="
                                                    font-size:11px;
                                                    color:#9aa3b2;
                                                "
                                            >
                                                © 2026 %s.
                                                All rights reserved.
                                            </span>

                                        </td>

                                    </tr>

                                </table>

                            </td>

                        </tr>

                    </table>

                </body>

                </html>
                """.formatted(
                safeAppName,
                safeAppName,
                safeOtp,
                safeAppName
        );
    }


    // ============================================================
    // ORDER CONFIRMATION EMAIL
    // ============================================================

    private String buildOrderConfirmationHtml(
            String username,
            String orderId,
            String status,
            Order order
    ) {

        StringBuilder rows =
                new StringBuilder();

        if (
                order.getItems() != null
                        &&
                !order.getItems().isEmpty()
        ) {

            for (
                    OrderItem item :
                    order.getItems()
            ) {

                if (item == null) {
                    continue;
                }

                String productName =
                        item.getProductName() == null
                                ||
                        item.getProductName().isBlank()
                                ? "Product"
                                : escapeHtml(
                                        item.getProductName()
                                );

                int quantity =
                        item.getQuantity() == null
                                ? 0
                                : Math.max(
                                        item.getQuantity(),
                                        0
                                );

                double subtotal =
                        item.getSubtotal() == null
                                ? 0.0
                                : item.getSubtotal();

                rows.append(
                        """
                        <tr>

                            <td
                                style="
                                    padding:
                                        15px
                                        0;
                                    border-bottom:
                                        1px solid
                                        #eef0f4;
                                    font-size:14px;
                                    line-height:20px;
                                    color:#17202a;
                                "
                            >
                                %s
                            </td>


                            <td
                                align="center"
                                width="55"
                                style="
                                    padding:
                                        15px
                                        5px;
                                    border-bottom:
                                        1px solid
                                        #eef0f4;
                                    font-size:14px;
                                    line-height:20px;
                                    color:#687385;
                                "
                            >
                                %d
                            </td>


                            <td
                                align="right"
                                width="100"
                                style="
                                    padding:
                                        15px
                                        0
                                        15px
                                        5px;
                                    border-bottom:
                                        1px solid
                                        #eef0f4;
                                    font-size:14px;
                                    line-height:20px;
                                    font-weight:600;
                                    color:#17202a;
                                    white-space:nowrap;
                                "
                            >
                                ₹%.2f
                            </td>

                        </tr>
                        """.formatted(
                                productName,
                                quantity,
                                subtotal
                        )
                );
            }

        } else {

            rows.append(
                    """
                    <tr>

                        <td
                            colspan="3"
                            style="
                                padding:
                                    16px
                                    0;
                                border-bottom:
                                    1px solid
                                    #eef0f4;
                                font-size:14px;
                                color:#687385;
                            "
                        >
                            Your order has been
                            received successfully.
                        </td>

                    </tr>
                    """
            );
        }


        double totalAmount =
                order.getTotalAmount() == null
                        ? 0.0
                        : order.getTotalAmount();


        String safeAppName =
                escapeHtml(appName);


        String statusColor =
                getStatusColor(status);


        String statusBackground =
                getStatusBackground(status);


        return """
                <!DOCTYPE html>

                <html lang="en">

                <head>

                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width,
                        initial-scale=1.0"
                    >

                    <meta
                        name="x-apple-disable-message-reformatting"
                    >

                    <title>
                        Order %s confirmed
                    </title>

                </head>


                <body
                    style="
                        margin:0;
                        padding:0;
                        width:100%%;
                        background:#f3f4f7;
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                    "
                >

                    <!-- PREHEADER -->

                    <div
                        style="
                            display:none;
                            max-height:0;
                            overflow:hidden;
                            opacity:0;
                        "
                    >
                        Your order %s has been
                        placed successfully.
                    </div>


                    <!-- OUTER -->

                    <table
                        role="presentation"
                        width="100%%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                            width:100%%;
                            background:#f3f4f7;
                        "
                    >

                        <tr>

                            <td
                                align="center"
                                style="
                                    padding:
                                        28px
                                        12px;
                                "
                            >

                                <!-- CARD -->

                                <table
                                    role="presentation"
                                    width="100%%"
                                    cellspacing="0"
                                    cellpadding="0"
                                    border="0"
                                    style="
                                        width:100%%;
                                        max-width:600px;
                                        background:#ffffff;
                                        border:
                                            1px solid
                                            #e5e7eb;
                                        border-radius:
                                            22px;
                                        overflow:hidden;
                                    "
                                >

                                    <!-- ================================= -->
                                    <!-- BRAND -->
                                    <!-- ================================= -->

                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    28px
                                                    20px
                                                    24px;
                                                background:#ffffff;
                                            "
                                        >

                                            <div
                                                style="
                                                    font-size:34px;
                                                    line-height:40px;
                                                    font-weight:700;
                                                    letter-spacing:.5px;
                                                    color:#101827;
                                                "
                                            >
                                                %s
                                            </div>

                                            <div
                                                style="
                                                    margin-top:5px;
                                                    font-size:9px;
                                                    line-height:14px;
                                                    font-weight:600;
                                                    letter-spacing:3px;
                                                    color:#9aa3b2;
                                                "
                                            >
                                                PREMIUM COMMERCE
                                            </div>

                                        </td>

                                    </tr>


                                    <!-- ================================= -->
                                    <!-- DARK ORDER HEADER -->
                                    <!-- ================================= -->

                                    <tr>

                                        <td
                                            style="
                                                padding:
                                                    28px
                                                    24px;
                                                background:#101827;
                                            "
                                        >

                                            <table
                                                role="presentation"
                                                width="100%%"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                            >

                                                <tr>

                                                    <td
                                                        valign="middle"
                                                        style="
                                                            padding-right:10px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                font-size:28px;
                                                                line-height:34px;
                                                                font-weight:500;
                                                                color:#ffffff;
                                                            "
                                                        >
                                                            %s
                                                        </div>

                                                        <div
                                                            style="
                                                                margin-top:5px;
                                                                font-size:10px;
                                                                line-height:15px;
                                                                letter-spacing:2px;
                                                                color:#9ba5b5;
                                                            "
                                                        >
                                                            ORDER CONFIRMATION
                                                        </div>

                                                    </td>


                                                    <td
                                                        align="right"
                                                        valign="middle"
                                                        width="100"
                                                    >

                                                        <span
                                                            style="
                                                                display:inline-block;
                                                                padding:
                                                                    8px
                                                                    12px;
                                                                border:
                                                                    1px solid
                                                                    %s;
                                                                border-radius:
                                                                    999px;
                                                                background:
                                                                    %s;
                                                                color:#ffffff;
                                                                font-size:9px;
                                                                line-height:14px;
                                                                font-weight:700;
                                                                letter-spacing:.5px;
                                                            "
                                                        >
                                                            %s
                                                        </span>

                                                    </td>

                                                </tr>

                                            </table>

                                        </td>

                                    </tr>


                                    <!-- ================================= -->
                                    <!-- MAIN -->
                                    <!-- ================================= -->

                                    <tr>

                                        <td
                                            style="
                                                padding:
                                                    34px
                                                    24px
                                                    30px;
                                            "
                                        >

                                            <!-- GREETING -->

                                            <div
                                                style="
                                                    font-size:30px;
                                                    line-height:38px;
                                                    font-weight:700;
                                                    color:#101827;
                                                "
                                            >
                                                Thanks for your
                                                order, %s.
                                            </div>


                                            <div
                                                style="
                                                    margin-top:12px;
                                                    font-size:15px;
                                                    line-height:24px;
                                                    color:#687385;
                                                "
                                            >
                                                Your order has been
                                                placed successfully.
                                                Here is a clean summary
                                                for your records.
                                            </div>


                                            <!-- ================================= -->
                                            <!-- ORDER INFO -->
                                            <!-- ================================= -->

                                            <table
                                                role="presentation"
                                                width="100%%"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                                style="
                                                    margin-top:26px;
                                                    background:#f8fafc;
                                                    border-radius:14px;
                                                "
                                            >

                                                <tr>

                                                    <td
                                                        valign="top"
                                                        style="
                                                            padding:
                                                                17px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                font-size:9px;
                                                                line-height:14px;
                                                                font-weight:700;
                                                                letter-spacing:1.2px;
                                                                color:#9aa3b2;
                                                            "
                                                        >
                                                            ORDER ID
                                                        </div>

                                                        <div
                                                            style="
                                                                margin-top:5px;
                                                                font-size:14px;
                                                                line-height:20px;
                                                                font-weight:700;
                                                                color:#17202a;
                                                            "
                                                        >
                                                            %s
                                                        </div>

                                                    </td>


                                                    <td
                                                        align="right"
                                                        valign="top"
                                                        style="
                                                            padding:
                                                                17px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                font-size:9px;
                                                                line-height:14px;
                                                                font-weight:700;
                                                                letter-spacing:1.2px;
                                                                color:#9aa3b2;
                                                            "
                                                        >
                                                            STATUS
                                                        </div>

                                                        <div
                                                            style="
                                                                margin-top:5px;
                                                                font-size:14px;
                                                                line-height:20px;
                                                                font-weight:700;
                                                                color:%s;
                                                            "
                                                        >
                                                            %s
                                                        </div>

                                                    </td>

                                                </tr>

                                            </table>


                                            <!-- ================================= -->
                                            <!-- ITEMS -->
                                            <!-- ================================= -->

                                            <table
                                                role="presentation"
                                                width="100%%"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                                style="
                                                    margin-top:28px;
                                                    border-collapse:
                                                        collapse;
                                                "
                                            >

                                                <tr>

                                                    <td
                                                        style="
                                                            padding:
                                                                0
                                                                0
                                                                9px;
                                                            font-size:9px;
                                                            line-height:14px;
                                                            font-weight:700;
                                                            letter-spacing:1.1px;
                                                            color:#9aa3b2;
                                                        "
                                                    >
                                                        ITEM
                                                    </td>

                                                    <td
                                                        align="center"
                                                        width="55"
                                                        style="
                                                            padding:
                                                                0
                                                                5px
                                                                9px;
                                                            font-size:9px;
                                                            line-height:14px;
                                                            font-weight:700;
                                                            letter-spacing:1.1px;
                                                            color:#9aa3b2;
                                                        "
                                                    >
                                                        QTY
                                                    </td>

                                                    <td
                                                        align="right"
                                                        width="100"
                                                        style="
                                                            padding:
                                                                0
                                                                0
                                                                9px
                                                                5px;
                                                            font-size:9px;
                                                            line-height:14px;
                                                            font-weight:700;
                                                            letter-spacing:1.1px;
                                                            color:#9aa3b2;
                                                        "
                                                    >
                                                        AMOUNT
                                                    </td>

                                                </tr>

                                                %s

                                            </table>


                                            <!-- ================================= -->
                                            <!-- TOTAL -->
                                            <!-- ================================= -->

                                            <table
                                                role="presentation"
                                                width="100%%"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                                style="
                                                    margin-top:2px;
                                                "
                                            >

                                                <tr>

                                                    <td
                                                        style="
                                                            padding-top:
                                                                20px;
                                                            border-top:
                                                                1px solid
                                                                #e7eaf0;
                                                        "
                                                    >

                                                        <span
                                                            style="
                                                                font-size:21px;
                                                                line-height:30px;
                                                                font-weight:700;
                                                                color:#17202a;
                                                            "
                                                        >
                                                            Total
                                                        </span>

                                                    </td>


                                                    <td
                                                        align="right"
                                                        style="
                                                            padding-top:
                                                                20px;
                                                            border-top:
                                                                1px solid
                                                                #e7eaf0;
                                                        "
                                                    >

                                                        <span
                                                            style="
                                                                font-size:21px;
                                                                line-height:30px;
                                                                font-weight:700;
                                                                color:#17202a;
                                                                white-space:
                                                                    nowrap;
                                                            "
                                                        >
                                                            ₹%.2f
                                                        </span>

                                                    </td>

                                                </tr>

                                            </table>


                                            <!-- ================================= -->
                                            <!-- NOTE -->
                                            <!-- ================================= -->

                                            <div
                                                style="
                                                    margin-top:28px;
                                                    font-size:12px;
                                                    line-height:20px;
                                                    color:#98a2b3;
                                                "
                                            >
                                                This email is your
                                                order confirmation
                                                from %s. Please keep it
                                                for your records.
                                            </div>

                                        </td>

                                    </tr>


                                    <!-- ================================= -->
                                    <!-- FOOTER -->
                                    <!-- ================================= -->

                                    <tr>

                                        <td
                                            align="center"
                                            style="
                                                padding:
                                                    18px
                                                    20px;
                                                background:#f8fafc;
                                                border-top:
                                                    1px solid
                                                    #edf0f4;
                                            "
                                        >

                                            <div
                                                style="
                                                    font-size:11px;
                                                    line-height:18px;
                                                    color:#9aa3b2;
                                                "
                                            >
                                                © 2026 %s.
                                                All rights reserved.
                                            </div>

                                        </td>

                                    </tr>

                                </table>

                            </td>

                        </tr>

                    </table>

                </body>

                </html>
                """.formatted(
                escapeHtml(orderId),
                escapeHtml(orderId),
                safeAppName,
                safeAppName,
                statusColor,
                statusBackground,
                escapeHtml(status),
                username,
                escapeHtml(orderId),
                statusColor,
                escapeHtml(status),
                rows,
                totalAmount,
                safeAppName,
                safeAppName
        );
    }


    // ============================================================
    // STATUS COLORS
    // ============================================================

    private String getStatusColor(
            String status
    ) {

        if (status == null) {
            return "#fbbf24";
        }

        return switch (
                status.toUpperCase()
        ) {

            case "CONFIRMED" ->
                    "#818cf8";

            case "PROCESSING" ->
                    "#a78bfa";

            case "SHIPPED" ->
                    "#60a5fa";

            case "DELIVERED" ->
                    "#34d399";

            case "CANCELLED" ->
                    "#fb7185";

            default ->
                    "#fbbf24";
        };
    }


    private String getStatusBackground(
            String status
    ) {

        if (status == null) {
            return "#3d3217";
        }

        return switch (
                status.toUpperCase()
        ) {

            case "CONFIRMED" ->
                    "#29235a";

            case "PROCESSING" ->
                    "#38265f";

            case "SHIPPED" ->
                    "#1d3558";

            case "DELIVERED" ->
                    "#123e32";

            case "CANCELLED" ->
                    "#4b1d29";

            default ->
                    "#3d3217";
        };
    }


    // ============================================================
    // HTML ESCAPING
    // ============================================================

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
}
