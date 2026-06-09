$(document).ready(function () {
    loadProductDetails();

    $(document).on("click", ".btn-add-cart", function () {
        let productId = $(this).data("id");

        $.ajax({
            type: "POST",
            url: "../../backend/services/cartServiceHandler.php",
            data: {
                method: "addToCart",
                productId: productId
            },
            dataType: "json",

            success: function () {
                if (typeof window.refreshCartBadge === "function") {
                    window.refreshCartBadge();
                }

            },

            error: function (xhr) {
                console.error("Error when adding to basket:", xhr.responseText);
            }
        });
    });
});

function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("product_id");

    if (!productId) {
        $("#productDetailsContainer").html(`
            <div class="alert alert-danger">
                No product selected.
            </div>
        `);
        return;
    }

    $.ajax({
        type: "GET",
        url: "../../backend/services/productServiceHandler.php",
        data: {
            method: "getProductById",
            product_id: productId
        },
        dataType: "json",

        success: function (product) {
            if (!product || !product.product_id) {
                $("#productDetailsContainer").html(`
                    <div class="alert alert-danger">
                        Product could not be found.
                    </div>
                `);
                return;
            }

            renderProductDetails(product);
        },

        error: function (xhr) {
            console.error("Error when loading product details:", xhr.responseText);

            $("#productDetailsContainer").html(`
                <div class="alert alert-danger">
                    Error when loading product details.
                </div>
            `);
        }
    });
}

function renderProductDetails(product) {
    let imageSrc = "https://via.placeholder.com/300";

    if (product.image) {
        imageSrc = `../../backend/productpictures/${product.image}`;
    }

    let ratingHtml = "";

    if (product.rating) {
        ratingHtml = `<p>Rating: ${escapeHtml(product.rating)} / 5</p>`;
    }

    let price = Number(product.price).toFixed(2);

    let description = escapeHtml(product.description).replaceAll("\n", "<br>");

    let html = `
        <div class="row">
            <div class="col-md-5 text-center">
                <img src="${imageSrc}"
                     class="img-fluid rounded"
                     style="max-height: 450px; max-width: 100%; object-fit: contain;"
                     alt="${escapeHtml(product.name)}">
            </div>

            <div class="col-md-7">
                <h2>${escapeHtml(product.name)}</h2>

                <p class="text-muted">
                    Category: ${escapeHtml(product.category)}
                </p>

                ${ratingHtml}

                <h4 class="fw-bold">
                    ${price} €
                </h4>

                <hr>

                <h5>Description</h5>
                <p>${description}</p>

                <button class="btn btn-outline-primary btn-add-cart"
                        data-id="${product.product_id}">
                    Add to basket
                </button>
            </div>
        </div>
    `;

    $("#productDetailsContainer").html(html);
}

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