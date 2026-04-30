$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: "../../backend/services/cartServiceHandler.php",
        data: { method: "getCart" },
        dataType: "json",
        success: function (items) {
            let body = $("#cartTableBody");
            body.empty();

            if (items.length === 0) {
                body.append('<tr><td colspan="4" class="text-center">Warenkorb ist leer.</td></tr>');
                return;
            }

            items.forEach(item => {
                let row = `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.price} €</td>
                        <td>${item.quantity}</td>
                        <td>${(item.price * item.quantity).toFixed(2)} €</td>
                    </tr>
                `;
                body.append(row);
            });
        }
    });
});