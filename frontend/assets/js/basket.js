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
                    body.append('<tr><td colspan="5" class="text-center">Dein Warenkorb ist leer.</td></tr>');
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
                        <td colspan="3" class="text-end fw-bold">Gesamtsumme:</td>
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
                }
            });
        }
    });
});