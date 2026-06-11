$(document).ready(function () {
    let selectedCheckoutPaymentId = "default";
    // NEU: Globale Variable für den aktivierten Gutschein im Frontend-State
    let appliedVoucher = null;

    loadBasket();

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
                    // Falls der Korb leer wird, Gutschein-Eingabe resetten
                    resetVoucherUI();
                    return;
                }

                let totalCartSum = 0;

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

                // ERWEITERT: Berechnung & Anzeige des Gutschein-Rabatts in der Tabelle
                if (appliedVoucher) {
                    foot.append(`
                        <tr>
                            <td colspan="3" class="text-end text-muted">Voucher Discount (${appliedVoucher.code}):</td>
                            <td colspan="2" class="text-danger fw-bold">-${appliedVoucher.value.toFixed(2)} €</td>
                        </tr>
                    `);

                    // Verhindert negative Endsummen
                    let finalTotal = Math.max(0, totalCartSum - appliedVoucher.value);

                    foot.append(`
                        <tr class="table-dark">
                            <td colspan="3" class="text-end fw-bold">Total:</td>
                            <td colspan="2" class="fw-bold">${finalTotal.toFixed(2)} €</td>
                        </tr>
                    `);
                } else {
                    foot.append(`
                        <tr class="table-dark">
                            <td colspan="3" class="text-end fw-bold">Total:</td>
                            <td colspan="2" class="fw-bold">${totalCartSum.toFixed(2)} €</td>
                        </tr>
                    `);
                }
            }
        });
    }

    // Event: Menge ändern (+ oder -)
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
                    window.refreshCartBadge();
                }
            }
        });
    });

    // Event: Produkt komplett löschen
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
                $("#checkoutMsg").html(`
                <div class="alert alert-warning">Please log in to place an order.</div>
            `);
                return;
            }

            let user = userRes.data;

            $("#modalUserInfo").html(`
            <strong>${user.firstname} ${user.lastname}</strong><br>
            ${user.address}, ${user.zip} ${user.city}
        `);

            fillCheckoutPaymentMethods(user, paymentMethodsRes.success ? paymentMethodsRes.data : []);
            fillCheckoutCartSummary();

            let modal = new bootstrap.Modal(document.getElementById("checkoutModal"));
            modal.show();
        }).fail(function () {
            $("#checkoutMsg").html(`
            <div class="alert alert-danger">Error loading checkout data.</div>
        `);
        });
    });

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

    // ERWEITERT: Berücksichtigt den Gutschein-Abzug im Bestätigungs-Modal
    function fillCheckoutCartSummary() {
        let cartBody = $("#modalCartItems");
        let cartFoot = $("#modalCartTotal");
        cartBody.empty();
        cartFoot.empty();

        let total = 0;
        $("#cartTableBody tr").each(function () {
            let cols = $(this).find("td");
            if (cols.length >= 4) {
                let name = $(cols[0]).text();
                let sum = $(cols[3]).text();
                // Verhindert das Miteinberechnen von Altsummen-Zeilen im DOM-Parsing
                if(!name.includes("Voucher Discount") && !name.includes("Total:")) {
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

        if (appliedVoucher) {
            cartBody.append(`
                <tr class="text-danger fw-bold">
                    <td>Voucher Discount (${appliedVoucher.code})</td>
                    <td class="text-end">-${appliedVoucher.value.toFixed(2)} €</td>
                </tr>
            `);
            total = Math.max(0, total - appliedVoucher.value);
        }

        cartFoot.append(`
            <tr class="fw-bold">
                <td>Total:</td>
                <td class="text-end">${total.toFixed(2)} €</td>
            </tr>
        `);
    }

    $("#checkoutPaymentMethod").on("change", function () {
        selectedCheckoutPaymentId = $(this).val();
    });

    // ERWEITERT: Sendet den Gutscheincode beim Kaufabschluss ans Backend mit
    $("#btnConfirmOrder").on("click", function () {
        bootstrap.Modal.getInstance(document.getElementById("checkoutModal")).hide();

        $.ajax({
            type: "POST",
            url: "../../backend/services/orderServiceHandler.php",
            data: {
                method: "placeOrder",
                paymentMethodId: selectedCheckoutPaymentId,
                voucherCode: appliedVoucher ? appliedVoucher.code : null // NEU hier
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
                    resetVoucherUI(); // Gutschein-State nach Kauf resetten
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

    // ==========================================
    // NEU: EVENT-HANDLER FÜR GUTSCHEIN-PRÜFUNG
    // ==========================================
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
                method: "redeemVoucher", // Bauen wir als nächstes im Backend
                code: voucherCode
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    messageDiv.text(response.message).css("color", "green");

                    // Gutschein-Daten im Frontend zwischenspeichern
                    appliedVoucher = {
                        code: voucherCode,
                        value: parseFloat(response.value)
                    };

                    // UI sperren
                    $("#voucherInput").prop("disabled", true);
                    $("#btnRedeemVoucher").prop("disabled", true);

                    // Warenkorb neu laden (zieht den Betrag jetzt automatisch ab!)
                    loadBasket();
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
        appliedVoucher = null;
        $("#voucherInput").val("").prop("disabled", false);
        $("#btnRedeemVoucher").prop("disabled", false);
        $("#basketVoucherMessage").text("");
    }
});