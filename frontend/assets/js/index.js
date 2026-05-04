$(document).ready(function () {

    // Beim Laden der Seite zuerst alle Kategorien aus der DB laden
    loadCategories();

    // Holt alle Kategorien, die aktuell in der products-Tabelle vorkommen
    function loadCategories() {
        $.ajax({
            type: "GET",
            url: "../backend/services/productServiceHandler.php",
            data: {
                method: "getAllCategories"
            },
            dataType: "json",

            success: function (categories) {
                let categoryContainer = $("#categoryContainer");
                categoryContainer.empty();

                // Falls keine Kategorien vorhanden sind
                if (!categories || categories.length === 0) {
                    categoryContainer.html('<div class="list-group-item">Keine Kategorien vorhanden.</div>');
                    $("#productContainer").html('<div class="col-12 text-center">Noch keine Produkte vorhanden.</div>');
                    return;
                }

                // Fixer Button für alle Kategorien
                let allCategoriesButton = `
                    <button type="button"
                            class="list-group-item list-group-item-action category-btn active"
                            data-category="all">
                        Alle Kategorien
                    </button>
                `;

                categoryContainer.append(allCategoriesButton);

                // Für jede echte Kategorie aus der DB wird links ein Button erstellt
                categories.forEach(function (category) {
                    let categoryButton = `
                        <button type="button"
                                class="list-group-item list-group-item-action category-btn"
                                data-category="${escapeHtml(category)}">
                            ${escapeHtml(category)}
                        </button>
                    `;

                    categoryContainer.append(categoryButton);
                });

                // Am Anfang werden alle Produkte geladen
                loadProducts("all");
            },

            error: function (xhr) {
                console.error("Fehler beim Laden der Kategorien:", xhr.responseText);
                $("#categoryContainer").html('<div class="list-group-item text-danger">Fehler beim Laden der Kategorien.</div>');
            }
        });
    }

    // Holt Produkte aus einer bestimmten Kategorie
    function loadProducts(category) {
        let requestData;

        if (category === "all") {
            requestData = {
                method: "getAllProducts"
            };
        } else {
            requestData = {
                method: "getProductsByCategory",
                category: category
            };
        }

        $.ajax({
            type: "GET",
            url: "../backend/services/productServiceHandler.php",
            data: requestData,
            dataType: "json",

            success: function (products) {
                console.log("Geladene Produkte:", products);
                renderProducts(products);
            },

            error: function (xhr) {
                console.error("Fehler beim Laden der Produkte:", xhr.responseText);
                $("#productContainer").html('<div class="alert alert-danger w-100">Fehler beim Laden der Produkte.</div>');
            }
        });
    }

    // Zeigt die geladenen Produkte als Cards an
    function renderProducts(products) {
        let container = $("#productContainer");
        container.empty();

        // Falls in der Kategorie keine Produkte vorhanden sind
        if (!products || products.length === 0) {
            container.append('<div class="col-12 text-center">Keine Produkte in dieser Kategorie vorhanden.</div>');
            return;
        }

        // Für jedes Produkt eine Card erstellen
        products.forEach(function (product) {
            let imageSrc = "https://via.placeholder.com/150";

            // Falls ein Produktbild vorhanden ist, dieses anzeigen
            if (product.image) {
                imageSrc = `../backend/productpictures/${product.image}`;
            }

            // Rating ist optional
            let ratingHtml = "";

            if (product.rating) {
                ratingHtml = `<p class="card-text">Bewertung: ${escapeHtml(product.rating)} / 5</p>`;
            }

            let price = Number(product.price).toFixed(2);

            let productCard = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <img src="${imageSrc}" class="card-img-top" alt="${escapeHtml(product.name)}">

                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(product.name)}</h5>

                            <p class="card-text text-truncate">
                                ${escapeHtml(product.description)}
                            </p>

                            <p class="card-text">
                                <small class="text-muted">
                                    Kategorie: ${escapeHtml(product.category)}
                                </small>
                            </p>

                            ${ratingHtml}

                            <p class="card-text fw-bold">
                                ${price} €
                            </p>

                            <button class="btn btn-outline-primary w-100 btn-add-cart"
                                    data-id="${product.product_id}">
                                In den Warenkorb
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.append(productCard);
        });
    }

    // Wenn auf eine Kategorie geklickt wird:
    // ohne Seitenreload neue Produkte laden
    $(document).on("click", ".category-btn", function () {
        let selectedCategory = $(this).data("category");

        $(".category-btn").removeClass("active");
        $(this).addClass("active");

        loadProducts(selectedCategory);
    });

    // Produkt in den Warenkorb legen
    $(document).on("click", ".btn-add-cart", function () {
        let productId = $(this).data("id");

        $.ajax({
            type: "POST",
            url: "../backend/services/cartServiceHandler.php",
            data: {
                method: "addToCart",
                productId: productId
            },
            dataType: "json",

            success: function () {
                if (typeof window.refreshCartBadge === "function") {
                    window.refreshCartBadge();
                }

                console.log("Produkt wurde zum Warenkorb hinzugefügt.");
            },

            error: function (xhr) {
                console.error("Fehler beim Hinzufügen zum Warenkorb:", xhr.responseText);
            }
        });
    });

    // Verhindert, dass Sonderzeichen oder HTML im Produktnamen die Seite kaputt machen
    function escapeHtml(text) {
        if (text === null || text === undefined) {
            return "";
        }

        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});