$(document).ready(function () {
    // Merkt sich die ID der ausgewählten Zahlungsart im Checkout-Modal
    let selectedCheckoutPaymentId = "default";

    // Beim Laden der Seite sofort den Warenkorb anzeigen
    loadBasket();

    // NEU: Event-Handler für das Zahlungsart-Dropdown im Modal.
    // Sorgt dafür, dass die Auswahl des Users tatsächlich in der Variable gespeichert wird!
    $(document).on("change", "#checkoutPaymentMethod", function () {
        selectedCheckoutPaymentId = $(this).val();
    });

    // Lädt die Produkte aus der Session/DB und rendert die Haupttabelle
    function loadBasket() {
        $.ajax({
            type: "GET",
            url: "../../backend/services/cartServiceHandler.php",
            data: { method: "getCart" },
            dataType: "json",
            success: function (items) {
                let body = $("#cartTableBody");
                let foot = $("#cartTableFoot");
                body.empty();
                foot.empty();

                if (items.length === 0) {
                    body.append('<tr><td colspan="5" class="text-center">Your basket is empty.</td></tr>');
                    resetVoucherUI();
                    return;
                }

                let totalCartSum = 0;

                // Produkte durchgehen und Zeilen generieren
                items.forEach(item => {
                    let itemTotal = item.price * item.quantity;
                    totalCartSum += itemTotal;

                    let row = `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.price} €</td>
                            <td>
                                <div class="input-group input-group-sm">
                                    <button class="btn btn-outline-secondary btn-change" data-id="${item.product_id}" data-delta="-1">-</button>
                                    <span class="input-group-text">${item.quantity}</span>
                                    <button class="btn btn-outline-secondary btn-change" data-id="${item.product_id}" data-delta="1">+</button>
                                </div>
                            </td>
                            <td>${itemTotal.toFixed(2)} €</td>
                            <td>
                                <button class="btn btn-sm btn-danger btn-remove" data-id="${item.product_id}">
                                    &times;
                                </button>
                            </td>
                        </tr>
                    `;
                    body.append(row);
                });

                // Das Rendern ist jetzt LEAN: Keine Gutschein-Berechnungen mehr in der Tabelle!
                foot.append(`
                    <tr class="table-dark">
                        <td colspan="3" class="text-end fw-bold">Total:</td>
                        <td colspan="2" class="fw-bold">${totalCartSum.toFixed(2)} €</td>
                    </tr>
                `);
            }
        });
    }

    // Event: Menge im Warenkorb erhöhen/verringern (+ / -)
    $(document).on("click", ".btn-change", function () {
        let id = $(this).data("id");
        let delta = $(this).data("delta");

        $.ajax({
            type: "POST",
            url: "../../backend/services/cartServiceHandler.php",
            data: { method: "changeQuantity", productId: id, delta: delta },
            success: function () {
                loadBasket();
                if (typeof window.refreshCartBadge === "function") {
                    window.refreshCharBadge();
                }
            }
        });
    });

    // Event: Produkt komplett aus dem Korb kicken
    $(document).on("click", ".btn-remove", function () {
        if (confirm("Produkt wirklich aus dem Warenkorb entfernen?")) {
            let id = $(this).data("id");
            $.ajax({
                type: "POST",
                url: "../../backend/services/cartServiceHandler.php",
                data: { method: "removeFromCart", productId: id },
                success: function () {
                    loadBasket();
                    if (typeof window.refreshCartBadge === "function") {
                        window.refreshCartBadge();
                    }
                }
            });
        }
    });

    // Klick auf "Checkout" -> Profildaten und Zahlungsmethoden parallel laden
    $("#btnCheckout").on("click", function () {
        let userRequest = $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            data: { method: "getUserProfile" },
            dataType: "json"
        });

        let paymentMethodsRequest = $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            data: { method: "getPaymentMethods" },
            dataType: "json"
        });

        $.when(userRequest, paymentMethodsRequest).done(function (userResult, paymentMethodsResult) {
            let userRes = userResult[0];
            let paymentMethodsRes = paymentMethodsResult[0];

            if (!userRes.success) {
                $("#checkoutMsg").html(`<div class="alert alert-warning">Please log in to place an order.</div>`);
                return;
            }

            let user = userRes.data;

            // Lieferadresse im Modal anzeigen
            $("#modalUserInfo").html(`
                <strong>${user.firstname} ${user.lastname}</strong><br>
                ${user.address}, ${user.zip} ${user.city}
            `);

            fillCheckoutPaymentMethods(user, paymentMethodsRes.success ? paymentMethodsRes.data : []);
            fillCheckoutCartSummary(user); // Hier wird das Kontoguthaben live verrechnet!

            let modal = new bootstrap.Modal(document.getElementById("checkoutModal"));
            modal.show();
        }).fail(function () {
            $("#checkoutMsg").html(`<div class="alert alert-danger">Error loading checkout data.</div>`);
        });
    });

    // Befüllt das Dropdown-Menü im Modal mit den Zahlungsmethoden
    function fillCheckoutPaymentMethods(user, paymentMethods) {
        let select = $("#checkoutPaymentMethod");
        select.empty();

        select.append(`
            <option value="default">
                Default: ${formatPaymentMethodLabel(user.payment_method, user.payment_method === "creditcard" ? "****" : "")}
            </option>
        `);

        paymentMethods
            .filter(paymentMethod => paymentMethod.is_default == 0)
            .forEach(function (paymentMethod) {
                select.append(`
                    <option value="${paymentMethod.id}">
                        ${formatPaymentMethodLabel(paymentMethod.method, paymentMethod.details)}
                    </option>
                `);
            });

        selectedCheckoutPaymentId = "default";
        select.val(selectedCheckoutPaymentId);
    }

    function formatPaymentMethodLabel(method, details) {
        if (method === "creditcard") {
            return "Credit Card " + (details ? "(" + details + ")" : "(****)");
        }
        return "Invoice";
    }

    // Generiert die Bestellübersicht IM MODAL-FENSTER (Steuern korrigiert bei Guthaben-Nutzung)
    function fillCheckoutCartSummary(user) {
        let cartBody = $("#modalCartItems");
        let cartFoot = $("#modalCartTotal");
        cartBody.empty();
        cartFoot.empty();

        let total = 0;

        // 1. SCHRITT: Liest die aktuellen Zeilen aus der Haupttabelle aus und berechnet die Summe der Waren
        $("#cartTableBody tr").each(function () {
            let cols = $(this).find("td");
            if (cols.length >= 4) {
                let name = $(cols[0]).text();
                let sum = $(cols[3]).text();

                if(!name.includes("Total:")) {
                    total += parseFloat(sum);
                    cartBody.append(`
                        <tr>
                            <td>${name}</td>
                            <td class="text-end">${sum}</td>
                        </tr>
                    `);
                }
            }
        });

        // 2. SCHRITT: Berechne die Steuern DIREKT vom Warenwert (bevor Guthaben abgezogen wird!)
        // Da deine Produktpreise sehr wahrscheinlich Bruttobeträge sind, ziehen wir hier die 20% MwSt. heraus.
        // (Formel: Bruttosumme * 20 / 120  bzw. Bruttosumme * 0.166667)
        let taxAmount = total * (20 / 120);

        // 3. SCHRITT: Das User-Guthaben gegenrechnen
        let userBalance = user && user.balance ? parseFloat(user.balance) : 0.0;

        if (userBalance > 0 && total > 0) {
            let balanceToUse = Math.min(total, userBalance);
            cartBody.append(`
                <tr class="text-success fw-bold">
                    <td>Account Balance used</td>
                    <td class="text-end">-${balanceToUse.toFixed(2)} €</td>
                </tr>
            `);
            // Ziehe das verbrauchte Guthaben von der zu zahlenden Endsumme ab
            total = Math.max(0, total - balanceToUse);
        }

        // 4. SCHRITT: Anzeige der Steuern (Bleibt jetzt immer erhalten, auch bei 0 € Rest!)
        cartFoot.append(`
            <tr class="text-muted small">
                <td>Includes 20% VAT:</td>
                <td class="text-end">${taxAmount.toFixed(2)} €</td>
            </tr>
        `);

        // 5. SCHRITT: Finale Endsumme anzeigen (was der User jetzt tatsächlich noch über externe Zahlungsmittel begleichen muss)
        cartFoot.append(`
            <tr class="table-light fw-bold border-top border-dark">
                <td>Total to pay:</td>
                <td class="text-end">${total.toFixed(2)} €</td>
            </tr>
        `);
    }

    // Kauf final absenden
    $("#btnConfirmOrder").on("click", function () {
        bootstrap.Modal.getInstance(document.getElementById("checkoutModal")).hide();

        $.ajax({
            type: "POST",
            url: "../../backend/services/orderServiceHandler.php",
            data: {
                method: "placeOrder",
                paymentMethodId: selectedCheckoutPaymentId
                // voucherCode wurde hier komplett entfernt, da das Backend beim Bestellen nichts mehr prüfen muss!
            },
            dataType: "json",
            success: function (res) {
                if (res.error === "not_logged_in") {
                    $("#checkoutMsg").html(`<div class="alert alert-warning">Please log in to place an order.</div>`);
                } else if (res.error === "cart_empty") {
                    $("#checkoutMsg").html(`<div class="alert alert-warning">Your basket is empty.</div>`);
                } else if (res.error === "missing_user_data") {
                    let fields = res.missing.join(", ");
                    $("#checkoutMsg").html(`
                    <div class="alert alert-warning">
                        Please complete your profile first. Missing: <strong>${fields}</strong>
                        <br><a href="profile.html" class="btn btn-sm btn-outline-dark mt-2">Go to Profile</a>
                    </div>`);
                } else if (res.error === "invalid_payment_method") {
                    $("#checkoutMsg").html(`<div class="alert alert-warning">Please select a valid payment method.</div>`);
                } else if (res.success) {
                    resetVoucherUI();
                    loadBasket();
                    if (typeof window.refreshCartBadge === "function") {
                        window.refreshCartBadge();
                    }
                    $("#checkoutMsg").html(`
                        <div class="alert alert-success">Order placed successfully! Order ID: ${res.order_id} | Total: ${res.total} €</div>
                    `);
                }
            }
        });
    });

    // NEU & REIN: Event-Handler für das sofortige Aufladen des Gutscheins auf das Konto
    $("#btnRedeemVoucher").on("click", function () {
        let voucherCode = $("#voucherInput").val().trim().toUpperCase();
        let messageDiv = $("#basketVoucherMessage");

        if (voucherCode.length !== 5) {
            messageDiv.text("Code must be exactly 5 characters.").css("color", "red");
            return;
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/voucherServiceHandler.php",
            data: {
                method: "redeemVoucher",
                code: voucherCode
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    // Zeigt die grüne Erfolgsmeldung inkl. des geladenen Betrags
                    messageDiv.text(response.message).css("color", "green");

                    // UI sperren, damit man den Code nicht doppelt absendet
                    $("#voucherInput").prop("disabled", true);
                    $("#btnRedeemVoucher").prop("disabled", true);

                    // Optional: Man könnte hier die Anzeige eines "Current Balance"-Labels auf der Seite aktualisieren via response.newBalance
                } else {
                    messageDiv.text(response.message).css("color", "red");
                }
            },
            error: function (xhr) {
                console.error("Error verifying voucher:", xhr.responseText);
                messageDiv.text("Server error during validation.").css("color", "red");
            }
        });
    });

    function resetVoucherUI() {
        $("#voucherInput").val("").prop("disabled", false);
        $("#btnRedeemVoucher").prop("disabled", false);
        $("#basketVoucherMessage").text("");
    }
});