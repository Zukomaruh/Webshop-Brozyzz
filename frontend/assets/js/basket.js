$(document).ready(function () {
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

                // Gesamtsumme anzeigen
                foot.append(`
                    <tr class="table-dark">
                        <td colspan="3" class="text-end fw-bold">Total:</td>
                        <td colspan="2" class="fw-bold">${totalCartSum.toFixed(2)} €</td>
                    </tr>
                `);
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
                loadBasket(); // Nach Änderung Liste neu laden
                if (typeof window.refreshCartBadge === "function") {
                    window.refreshCartBadge(); // Badge in der Navbar neu laden
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
                    loadBasket(); // Nach Löschen Liste neu laden
                    if (typeof window.refreshCartBadge === "function") {
                        window.refreshCartBadge(); // Badge in der Navbar neu laden
                    }
                }
            });
        }
    });
    $("#btnCheckout").on("click", function () {
        $.ajax({
            type: "POST",
            url: "../../backend/services/orderServiceHandler.php",
            data: { method: "placeOrder" },
            dataType: "json",
            success: function (res) {
                console.log(res);
                if (res.error === "not_logged_in") {
                    $("#checkoutMsg").html(`
                    <div class="alert alert-warning">Please log in to place an order.</div>
                `);
                } else if (res.error === "cart_empty") {
                    $("#checkoutMsg").html(`
                    <div class="alert alert-warning">Your basket is empty.</div>
                `);
                } else if (res.error === "missing_user_data") {
                    let fields = res.missing.join(", ");
                    $("#checkoutMsg").html(`
                    <div class="alert alert-warning">
                       Please complete your profile first. Missing: <strong>${fields}</strong>
                        <br><a href="profile.html" class="btn btn-sm btn-outline-dark mt-2">Go to Profile</a>
                    </div>
                `);
                } else if (res.success) {
                    loadBasket();
                    if (typeof window.refreshCartBadge === "function") {
                        window.refreshCartBadge();
                    }

                    //Bestätigung anzeigen
                    $("#checkoutMsg").html(`
                        <div class="alert alert-success">Order placed successfully! Order ID: ${res.order_id} | Total: ${res.total} €</div>
                    `);
                }
            }
        });
    });
});