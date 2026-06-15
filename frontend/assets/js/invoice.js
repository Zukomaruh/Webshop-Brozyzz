$(document).ready(function() {
    // order_id aus URL holen
    let params = new URLSearchParams(window.location.search);
    let orderId = params.get("order_id");
    if (!orderId) {
        $("#invoiceWrapper").html('<div class="alert alert-danger">No order ID provided.</div>');
        return;
    }

    // order Daten laden
    $.ajax({
        type: "GET",
        url: "../../backend/services/orderServiceHandler.php",
        data: {method: "getOrderById", order_id: orderId},
        dataType: "json",
        success: function(result) {
            if(result.error) {
                $("#invoiceWrapper").html(`<div class="alert alert-danger">Error: ${result.error}</div>`);
                return;
            }

            let order = result.data.order;
            let items = result.data.items;

            // Rechnungsnummer und Datum
            $("#invoiceNumber").text("Invoice #INV-" + order.id);
            $("#invoiceDate").text("Date: " + formatDate(order.created_at));
            $("#deliveryDate").text("Delivery date: " + formatDate(order.created_at));

            // Kundeninfo aus shipping_address
            let address = JSON.parse(order.shipping_address);

            let salutation = "";
            if (order.gender === "mr") {
                salutation = "Mr.";
            } else if (order.gender === "ms") {
                salutation = "Ms.";
            }

            $("#customerInfo").html(`
                ${salutation} ${order.firstname} ${order.lastname}<br>
                ${address.address}<br>
                ${address.zip} ${address.city}
            `);

            // Produkte befüllen
            let itemsBody = $("#invoiceItems");
            items.forEach(function (item) {
                itemsBody.append(`
                    <tr>
                        <td>${item.product_name}</td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-end">${parseFloat(item.unit_price).toFixed(2)} €</td>
                        <td class="text-end">${parseFloat(item.item_total).toFixed(2)} €</td>
                    </tr>
                `);
            });

            // Dynamischer Zusammenbau der Rechnungs-Summenzeilen
            let summaryHtml = `
                <tr>
                    <td colspan="3" class="text-end">Subtotal incl. VAT:</td>
                    <td class="text-end">${parseFloat(order.subtotal).toFixed(2)} €</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-end">Included VAT (20%):</td>
                    <td class="text-end">${parseFloat(order.tax_amount).toFixed(2)} €</td>
                </tr>
            `;

            // Falls Guthaben genutzt wurde -> Zeile einfügen
            let discount = order.discount_amount ? parseFloat(order.discount_amount) : 0.0;
            if (discount > 0) {
                summaryHtml += `
                    <tr class="text-success">
                        <td colspan="3" class="text-end">Account Balance used:</td>
                        <td class="text-end">-${discount.toFixed(2)} €</td>
                    </tr>
                `;
            }

            // Methode formatieren für die Anzeige
            let paymentMethodText = order.payment_method ? order.payment_method.toUpperCase() : "N/A";
            if (order.payment_details) {
                paymentMethodText += ` (${order.payment_details})`;
            }

            // Bezahlmethode & Finale Endsumme hinzufügen
            summaryHtml += `
                <tr>
                    <td colspan="3" class="text-end text-muted small">Payment Method:</td>
                    <td class="text-end text-muted small">${paymentMethodText}</td>
                </tr>
                <tr class="table-dark fw-bold">
                    <td colspan="3" class="text-end">Total to pay:</td>
                    <td class="text-end">${parseFloat(order.total).toFixed(2)} €</td>
                </tr>
            `;

            $("#invoiceSummary").html(summaryHtml);
        },
        error: function(xhr) {
            console.log(xhr.responseText);
            $("#invoiceWrapper").html('<div class="alert alert-danger">Error loading invoice.</div>');
        }
    });

    function formatDate(dateString) {
        let parts = dateString.substring(0, 10).split("-");
        return parts[2] + "." + parts[1] + "." + parts[0];
    }
});