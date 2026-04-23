$(document).ready(function () {
    loadProducts();

    function loadProducts() {
        $.ajax({
            type: "GET",
            url: "../backend/services/productServiceHandler.php",
            data: { method: "getAllProducts" },
            dataType: "json",
            success: function (products) {
                let container = $("#productContainer");
                container.empty(); // Lade-Text entfernen

                if (products.length === 0) {
                    container.append('<div class="col-12 text-center">Noch keine Produkte vorhanden.</div>');
                    return;
                }

                //loopen durch alle Produkte vom Server
                products.forEach(product => {
                    let imageSrc = 'https://via.placeholder.com/150';

                    if (product.image) {
                        imageSrc = `../backend/productpictures/${product.image}`;
                    }

                    let productCard = `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100">
                                    <img src="${imageSrc}" class="card-img-top" alt="${product.name}">
                                <div class="card-body">
                                    <h5 class="card-title">${product.name}</h5>
                                    <p class="card-text text-truncate">${product.description}</p>
                                    <p class="card-text"><small class="text-muted">Kategorie: ${product.category}</small></p>
                                    <p class="card-text fw-bold">${product.price} Euro</p>
                                    <button class="btn btn-outline-primary w-100">In den Warenkorb</button>
                                </div>
                            </div>
                        </div>
                    `;
                    container.append(productCard);
                });
            },
            error: function () {
                $("#productContainer").html('<div class="alert alert-danger w-100">Fehler beim Laden der Produkte.</div>');
            }
        });
    }
});