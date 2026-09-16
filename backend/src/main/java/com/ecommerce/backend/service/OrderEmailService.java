package com.ecommerce.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

@Service
public class OrderEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public OrderEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends the Zyphora order confirmation email.
     *
     * The email is sent asynchronously so that a slow SMTP server
     * does not delay the order API response.
     *
     * IMPORTANT:
     * Email failure will NOT cause the order itself to fail.
     */
    @Async
    public void sendOrderConfirmation(
            String customerEmail,
            String customerName,
            Long orderId,
            String status,
            List<OrderEmailItem> items,
            BigDecimal totalAmount
    ) {

        if (customerEmail == null || customerEmail.isBlank()) {
            System.err.println(
                    "Zyphora order email skipped: customer email is empty."
            );
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            String normalizedName =
                    customerName == null ||
                    customerName.isBlank()
                            ? "Customer"
                            : customerName.trim();

            String normalizedStatus =
                    status == null ||
                    status.isBlank()
                            ? "PENDING"
                            : status.trim().toUpperCase(Locale.ROOT);

            String orderNumber =
                    "ORD-" + orderId;

            String html =
                    buildOrderConfirmationHtml(
                            normalizedName,
                            orderNumber,
                            normalizedStatus,
                            items,
                            totalAmount
                    );

            String plainText =
                    buildPlainTextEmail(
                            normalizedName,
                            orderNumber,
                            normalizedStatus,
                            items,
                            totalAmount
                    );

            helper.setFrom(
                    fromEmail,
                    "Zyphora"
            );

            helper.setTo(
                    customerEmail.trim()
            );

            helper.setSubject(
                    "Order " +
                    orderNumber +
                    " confirmed — Zyphora"
            );

            helper.setText(
                    plainText,
                    html
            );

            mailSender.send(message);

            System.out.println(
                    "Zyphora order confirmation email sent to: "
                    + customerEmail
            );

        } catch (
                MessagingException |
                java.io.UnsupportedEncodingException e
        ) {

            /*
             * Do NOT throw this exception.
             *
             * The order was already created successfully.
             * An SMTP failure should not turn a successful
             * order into a failed order response.
             */
            System.err.println(
                    "Failed to send Zyphora order confirmation email: "
                    + e.getMessage()
            );
        }
    }

    /**
     * Builds the responsive HTML email.
     */
    private String buildOrderConfirmationHtml(
            String customerName,
            String orderNumber,
            String status,
            List<OrderEmailItem> items,
            BigDecimal totalAmount
    ) {

        String statusColor =
                getStatusColor(status);

        String statusBackground =
                getStatusBackground(status);

        String itemRows =
                buildItemRows(items);

        String formattedTotal =
                formatAmount(totalAmount);

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
                        Zyphora Order Confirmation
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
                        Your Zyphora order %s has been
                        placed successfully.
                    </div>


                    <!-- OUTER CONTAINER -->
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
                                    padding:30px 12px;
                                "
                            >

                                <!-- EMAIL CARD -->
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
                                        border-radius:22px;
                                        overflow:hidden;
                                        border:
                                            1px solid
                                            #e6e8ed;
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
                                                Zyphora
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
                                    <!-- DARK HEADER -->
                                    <!-- ================================= -->

                                    <tr>

                                        <td
                                            style="
                                                padding:
                                                    30px
                                                    28px;
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

                                                    <!-- LEFT -->
                                                    <td
                                                        valign="middle"
                                                    >

                                                        <div
                                                            style="
                                                                font-size:28px;
                                                                line-height:34px;
                                                                font-weight:500;
                                                                color:#ffffff;
                                                            "
                                                        >
                                                            Zyphora
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


                                                    <!-- RIGHT -->
                                                    <td
                                                        align="right"
                                                        valign="middle"
                                                    >

                                                        <span
                                                            style="
                                                                display:inline-block;
                                                                padding:
                                                                    9px
                                                                    14px;
                                                                border:
                                                                    1px solid
                                                                    %s;
                                                                border-radius:999px;
                                                                background:%s;
                                                                color:#ffffff;
                                                                font-size:10px;
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
                                    <!-- MAIN CONTENT -->
                                    <!-- ================================= -->

                                    <tr>

                                        <td
                                            style="
                                                padding:
                                                    36px
                                                    28px
                                                    32px;
                                            "
                                        >

                                            <!-- GREETING -->

                                            <div
                                                style="
                                                    font-size:30px;
                                                    line-height:37px;
                                                    font-weight:700;
                                                    color:#101827;
                                                "
                                            >
                                                Thanks for your
                                                order, %s.
                                            </div>


                                            <div
                                                style="
                                                    margin-top:13px;
                                                    font-size:15px;
                                                    line-height:24px;
                                                    color:#687385;
                                                "
                                            >
                                                Your order has been placed
                                                successfully. Here is a clean
                                                summary for your records.
                                            </div>


                                            <!-- ================================= -->
                                            <!-- ORDER INFORMATION -->
                                            <!-- ================================= -->

                                            <table
                                                role="presentation"
                                                width="100%%"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                                style="
                                                    margin-top:28px;
                                                    background:#f8fafc;
                                                    border-radius:14px;
                                                "
                                            >

                                                <tr>

                                                    <td
                                                        style="
                                                            padding:
                                                                18px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                font-size:9px;
                                                                line-height:14px;
                                                                font-weight:600;
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
                                                        style="
                                                            padding:
                                                                18px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                font-size:9px;
                                                                line-height:14px;
                                                                font-weight:600;
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
                                                    margin-top:30px;
                                                    border-collapse:collapse;
                                                "
                                            >

                                                <!-- COLUMN HEADERS -->

                                                <tr>

                                                    <td
                                                        style="
                                                            padding:
                                                                0
                                                                0
                                                                10px;
                                                            font-size:9px;
                                                            line-height:14px;
                                                            font-weight:700;
                                                            letter-spacing:1.2px;
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
                                                                10px;
                                                            font-size:9px;
                                                            line-height:14px;
                                                            font-weight:700;
                                                            letter-spacing:1.2px;
                                                            color:#9aa3b2;
                                                        "
                                                    >
                                                        QTY
                                                    </td>

                                                    <td
                                                        align="right"
                                                        width="95"
                                                        style="
                                                            padding:
                                                                0
                                                                0
                                                                10px
                                                                5px;
                                                            font-size:9px;
                                                            line-height:14px;
                                                            font-weight:700;
                                                            letter-spacing:1.2px;
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
                                                    margin-top:4px;
                                                "
                                            >

                                                <tr>

                                                    <td
                                                        style="
                                                            padding-top:20px;
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
                                                            padding-top:20px;
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
                                                                white-space:nowrap;
                                                            "
                                                        >
                                                            ₹%s
                                                        </span>

                                                    </td>

                                                </tr>

                                            </table>


                                            <!-- ================================= -->
                                            <!-- FOOTNOTE -->
                                            <!-- ================================= -->

                                            <div
                                                style="
                                                    margin-top:29px;
                                                    font-size:13px;
                                                    line-height:21px;
                                                    color:#9aa3b2;
                                                "
                                            >
                                                This email is your order
                                                confirmation from Zyphora.
                                                Please keep it for your
                                                records.
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
                                                    20px
                                                    28px;
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
                                                © Zyphora · Premium Commerce
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
                escapeHtml(orderNumber),
                statusColor,
                statusBackground,
                escapeHtml(status),
                escapeHtml(customerName),
                escapeHtml(orderNumber),
                statusColor,
                escapeHtml(status),
                itemRows,
                formattedTotal
        );
    }


    /**
     * Creates the individual order item rows.
     */
    private String buildItemRows(
            List<OrderEmailItem> items
    ) {

        if (items == null || items.isEmpty()) {

            return """
                    <tr>
                        <td
                            colspan="3"
                            style="
                                padding:16px 0;
                                border-bottom:
                                    1px solid #eef0f4;
                                font-size:14px;
                                color:#687385;
                            "
                        >
                            Your order has been received successfully.
                        </td>
                    </tr>
                    """;
        }

        StringBuilder rows =
                new StringBuilder();

        for (OrderEmailItem item : items) {

            if (item == null) {
                continue;
            }

            String name =
                    item.name() == null ||
                    item.name().isBlank()
                            ? "Item"
                            : item.name();

            int quantity =
                    Math.max(
                            item.quantity(),
                            1
                    );

            BigDecimal amount =
                    item.amount() == null
                            ? BigDecimal.ZERO
                            : item.amount();

            rows.append(
                    """
                    <tr>

                        <td
                            style="
                                padding:
                                    16px
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
                            style="
                                padding:
                                    16px
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
                            style="
                                padding:
                                    16px
                                    0
                                    16px
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
                            ₹%s
                        </td>

                    </tr>
                    """.formatted(
                            escapeHtml(name),
                            quantity,
                            formatAmount(amount)
                    )
            );
        }

        return rows.toString();
    }


    /**
     * Plain-text fallback for email clients that
     * don't support HTML.
     */
    private String buildPlainTextEmail(
            String customerName,
            String orderNumber,
            String status,
            List<OrderEmailItem> items,
            BigDecimal totalAmount
    ) {

        StringBuilder text =
                new StringBuilder();

        text.append(
                "ZYphora\n"
        );

        text.append(
                "ORDER CONFIRMATION\n\n"
        );

        text.append(
                "Thanks for your order, "
        );

        text.append(
                customerName
        );

        text.append(
                ".\n\n"
        );

        text.append(
                "Order ID: "
        );

        text.append(
                orderNumber
        );

        text.append(
                "\n"
        );

        text.append(
                "Status: "
        );

        text.append(
                status
        );

        text.append(
                "\n\n"
        );

        text.append(
                "ITEMS\n"
        );

        if (items != null) {

            for (OrderEmailItem item : items) {

                if (item == null) {
                    continue;
                }

                text.append(
                        item.name()
                );

                text.append(
                        " x"
                );

                text.append(
                        item.quantity()
                );

                text.append(
                        " — ₹"
                );

                text.append(
                        formatAmount(
                                item.amount()
                        )
                );

                text.append(
                        "\n"
                );
            }
        }

        text.append(
                "\nTotal: ₹"
        );

        text.append(
                formatAmount(totalAmount)
        );

        text.append(
                "\n\n"
        );

        text.append(
                "This email is your order confirmation "
                        + "from Zyphora. Please keep it for "
                        + "your records."
        );

        return text.toString();
    }


    /**
     * Formats currency using Indian number formatting.
     */
    private String formatAmount(
            BigDecimal amount
    ) {

        if (amount == null) {
            amount = BigDecimal.ZERO;
        }

        NumberFormat formatter =
                NumberFormat.getNumberInstance(
                        Locale.ENGLISH
                );

        formatter.setMinimumFractionDigits(2);
        formatter.setMaximumFractionDigits(2);

        return formatter.format(
                amount
        );
    }


    /**
     * Determines the status text color.
     */
    private String getStatusColor(
            String status
    ) {

        if (status == null) {
            return "#f59e0b";
        }

        return switch (
                status.toUpperCase(Locale.ROOT)
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


    /**
     * Determines the status badge background.
     */
    private String getStatusBackground(
            String status
    ) {

        if (status == null) {
            return "#3d3217";
        }

        return switch (
                status.toUpperCase(Locale.ROOT)
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


    /**
     * Basic HTML escaping to prevent user/order data
     * from breaking the generated email markup.
     */
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


    /**
     * Lightweight DTO used only by the email service.
     *
     * amount = total amount for that particular line item.
     */
    public record OrderEmailItem(
            String name,
            int quantity,
            BigDecimal amount
    ) {
    }
}
