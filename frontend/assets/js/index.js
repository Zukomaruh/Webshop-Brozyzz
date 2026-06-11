$(document).ready(function () {
    //timer for product Search
    let timer;
    // Beim Laden der Seite zuerst alle Kategorien aus der DB laden
    loadCategories();

    // Wenn auf eine Kategorie geklickt wird:
    // ohne Seitenreload neue Produkte laden
    $(document).on("click", ".category-btn", function () {
        let selectedCategory = $(this).data("category");

        $(".category-btn").removeClass("active");
        $(this).addClass("active");

        loadProducts(selectedCategory);
    });

    $(document).on("click", ".btn-add-cart", function (event) {
        event.stopPropagation();
        let productId = $(this).data("id");
        addToCart(productId);
    });

    //Die ausgelagerte Funktion (wird von Klick UND Drag verwendet)
    function addToCart(productId) {
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
                // Optional: Visuelles Feedback am Warenkorb triggern
                $("#nav-basket").addClass("bounce");
                setTimeout(() => $("#nav-basket").removeClass("bounce"), 500);
            },
            error: function (xhr) {
                console.error("Error when adding to basket:", xhr.responseText);
            }
        });
    }

    $("#searchInput").on("input", function (event) {
        if ($(this).val() !== "") {
            $("#clearSearch").show();
        } else {
            $("#clearSearch").hide();
        }
        let query = $(this).val();
        clearTimeout(timer);
        if (query !== "") {
            //timer so that not every char input produces an ajax call
            timer = setTimeout(function () {
                $.ajax({
                    type: "GET",
                    url: "../backend/services/productServiceHandler.php",
                    data: { method: "searchProducts", query: query },
                    dataType: "json",
                    success: function (products) {
                        renderProducts(products, "No Products Found");
                    },
                    error: function (xhr) {
                        console.error("No products found", xhr.responseText);
                    }
                })
            }, 300)
        }else{
            loadProducts("all")
        }
    });

    $("#clearSearch").on("click", function () {
        $("#searchInput").val("");
        $(this).hide();
        loadProducts("all");
    });

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
                    categoryContainer.html('<div class="list-group-item">No Categories existing yet.</div>');
                    $("#productContainer").html('<div class="col-12 text-center">No Products existing yet.</div>');
                    return;
                }

                // Fixer Button für alle Kategorien
                let allCategoriesButton = `
                    <button type="button"
                            class="list-group-item list-group-item-action category-btn active"
                            data-category="all">
                        All Categories
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
                console.error("Error when loading categories:", xhr.responseText);
                $("#categoryContainer").html('<div class="list-group-item text-danger">Error when loading categories.</div>');
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
                renderProducts(products);
            },

            error: function (xhr) {
                console.error("Error when loading products:", xhr.responseText);
                $("#productContainer").html('<div class="alert alert-danger w-100">Error when loading products.</div>');
            }
        });
    }

    // Zeigt die geladenen Produkte als Cards an
    function renderProducts(products, emptyMessage = "No products in this category.") {
        let container = $("#productContainer");
        container.empty();

        // Falls in der Kategorie keine Produkte vorhanden sind
        if (!products || products.length === 0) {
            container.append(`<div class="col-12 text-center">${emptyMessage}</div>`);
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
                ratingHtml = `<p class="card-text">Rating: ${escapeHtml(product.rating)} / 5</p>`;
            }

            let price = Number(product.price).toFixed(2);

            let productCard = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 product-card" data-id="${product.product_id}" style="cursor: pointer;" draggable="true">
                        <img src="${imageSrc}" class="card-img-top" alt="${escapeHtml(product.name)}">

                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(product.name)}</h5>

                            <p class="card-text text-truncate">
                                ${escapeHtml(product.description)}
                            </p>

                            <p class="card-text">
                                <small class="text-muted">
                                    Category: ${escapeHtml(product.category)}
                                </small>
                            </p>

                            ${ratingHtml}

                            <p class="card-text fw-bold">
                                ${price} €
                            </p>

                            <button class="btn btn-outline-primary w-100 btn-add-cart"
                                    data-id="${product.product_id}">
                                Add to basket
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.append(productCard);
        });
    }

    // Öffnet die Produktdetailseite beim Klick auf eine Produktkarte
    $(document).on("click", ".product-card", function () {
        let productId = $(this).data("id");
        window.location.href = `pages/productDetails.html?product_id=${productId}`;
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

    // ---- DRAG & DROP LOGIK ----

    // Wenn der User anfängt, die Card zu ziehen
    $(document).on("dragstart", ".product-card", function (event) {
        let productId = $(this).data("id");
        // Speichert die ID des Produkts im Drag-Event
        event.originalEvent.dataTransfer.setData("text/plain", productId);

        // Macht die Card während des Ziehens leicht transparent
        $(this).css("opacity", "0.5");
    });

    // Wenn der Drag-Vorgang beendet wird (egal ob erfolgreich oder nicht)
    $(document).on("dragend", ".product-card", function () {
        $(this).css("opacity", "1.0");
    });

    // Erlaubt das Drüberziehen über den Basket-Button (Standard-Browser-Verhalten blockieren)
    $(document).on("dragover", 'a[href*="basket.html"]', function (event) {
        event.preventDefault();
        // Visuelles Feedback: Button vergrößern und Schatten werfen
        $(this).addClass("shadow").css("transform", "scale(1.08)");
    });

    // Wenn der User den Bereich des Basket-Buttons wieder verlässt
    $(document).on("dragleave", 'a[href*="basket.html"]', function () {
        $(this).removeClass("shadow").css("transform", "scale(1)");
    });

    // Wenn die Card auf dem Basket-Button losgelassen wird
    $(document).on("drop", 'a[href*="basket.html"]', function (event) {
        event.preventDefault();
        $(this).removeClass("shadow").css("transform", "scale(1)");

        // ID auslesen und das Produkt via AJAX hinzufügen
        let productId = event.originalEvent.dataTransfer.getData("text/plain");
        if (productId) {
            addToCart(productId);
        }
    });
});