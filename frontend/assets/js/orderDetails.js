$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");

    if (!orderId) {
        showOrderMessage("No order selected.", "warning");
        return;
    }

    loadOrderDetails(orderId);

    $("#btnPrintInvoice").click(function () {
        window.open("invoice.html?order_id=" + orderId, "_blank");
    });
});

function loadOrderDetails(orderId) {
    $.ajax({
        type: "GET",
        url: "../../backend/services/orderServiceHandler.php",
        cache: false,
        data: {
            method: "getOrderById",
            order_id: orderId
        },
        dataType: "json",

        success: function (response) {
            console.log(response);

            if (response.error === "not_logged_in") {
                showOrderMessage("Please log in to view this order.", "warning");
                return;
            }

            if (response.error === "unauthorized") {
                showOrderMessage("You are not allowed to view this order.", "danger");
                return;
            }

            if (response.error === "missing_order_id") {
                showOrderMessage("No order selected.", "warning");
                return;
            }

            if (response.success) {
                displayOrderDetails(response.data);
            } else {
                showOrderMessage("Order details could not be loaded.", "danger");
            }
        },

        error: function (xhr) {
            console.error("Order detail loading error:", xhr.responseText);
            showOrderMessage("Error connecting to the server.", "danger");
        }
    });
}

function displayOrderDetails(data) {
    const order = data.order;
    const items = data.items;

    $("#orderDetailMessage").empty();
    $("#orderDetailWrapper").removeClass("d-none");

    $("#orderId").text("#" + order.id);
    $("#orderDate").text(OrderUtils.formatOrderDate(order.created_at));
    $("#orderStatus").html(OrderUtils.renderOrderStatusBadge(order.status));
    $("#customerName").text(order.firstname + " " + order.lastname);

    // Anzeige der Bezahlmethode (inkl. Details, falls vorhanden)
    let paymentText = order.payment_method ? order.payment_method.toUpperCase() : "N/A";
    if (order.payment_details) {
        paymentText += ` (${order.payment_details})`;
    }
    $("#orderPaymentMethod").text(paymentText);

    let tableBody = $("#orderItemsTableBody");
    tableBody.empty();

    if (!items || items.length === 0) {
        tableBody.html(`
            <tr>
                <td colspan="4" class="text-center">
                    No items found for this order.
                </td>
            </tr>
        `);
    } else {
        items.forEach(function (item) {
            let unitPrice = parseFloat(item.unit_price).toFixed(2);

            // REPARIERT: Nutzt jetzt 'item_total' aus dem angepassten Backend-Query
            let itemTotalFormatted = parseFloat(item.item_total).toFixed(2);

            let row = `
                <tr>
                    <td>${escapeHtml(item.product_name)}</td>
                    <td>${item.quantity}</td>
                    <td>${unitPrice} €</td>
                    <td>${itemTotalFormatted} €</td>
                </tr>
            `;

            tableBody.append(row);
        });
    }

    $("#orderSubtotal").text(parseFloat(order.subtotal).toFixed(2) + " €");
    $("#orderTax").text(parseFloat(order.tax_amount).toFixed(2) + " €");

    // Rabatt / Verbrauchtes Kontoguthaben dynamisch anzeigen
    let discount = order.discount_amount ? parseFloat(order.discount_amount) : 0.0;
    if (discount > 0) {
        $("#orderDiscount").text("-" + discount.toFixed(2) + " €");
        $("#orderDiscountWrapper").removeClass("d-none");
    } else {
        $("#orderDiscountWrapper").addClass("d-none");
    }

    // Zeigt die Gesamtsumme der Bestellung an
    $("#orderTotal").text(parseFloat(order.total).toFixed(2) + " €");
}

function showOrderMessage(message, type) {
    $("#orderDetailWrapper").addClass("d-none");

    $("#orderDetailMessage").html(`
        <div class="alert alert-${type}">
            ${message}
        </div>
    `);
}

function escapeHtml(text) {
    if (!text) {
        return "";
    }

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}