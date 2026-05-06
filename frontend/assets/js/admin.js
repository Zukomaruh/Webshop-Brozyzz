$(document).ready(function () {

    // Prüffunktion beim Laden der Seite
    requireAdmin();
    $("body").show();
    loadProducts();

    //switcht view
    $("#btnShowAddProduct").click(function () {
        $("#addProductView").show();
        $("#productListView").hide();
        $("#btnShowAddProduct").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowProductList").addClass("btn-outline-primary").removeClass("btn-primary");
    });

    //switcht view
    $("#btnShowProductList").click(function () {
        $("#productListView").show();
        $("#addProductView").hide();
        $("#btnShowProductList").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowAddProduct").addClass("btn-outline-primary").removeClass("btn-primary");
        //Nicht zwingend notwendig:
        // loadProducts();
    });

    $("#createProductForm").submit(function (e) {
        e.preventDefault();

        let formData = new FormData(this);
        formData.append("method", "createProduct");

        $.ajax({
            type: "POST",
            url: "../../backend/services/productServiceHandler.php",
            data: formData,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#productMessage").text(response.message).css("color", "green");
                    $("#createProductForm")[0].reset();
                } else {
                    $("#productMessage").text(response.message).css("color", "red");
                }
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                $("#productMessage").text("Server-Fehler beim Speichern.").css("color", "red");
            }
        });
    });

    //Lädt Produkte aus DB
    function loadProducts() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/productServiceHandler.php",
            data: { method: "getAllProducts" },
            success: function (products) {
                $("#productTableBody").empty();
                products.forEach(function (product) {
                    let row = `<tr>
                        <td>${product.product_id}</td>
                        <td><img src="../../backend/productpictures/${product.image}" height="50"></td>
                        <td>${product.description}</td>
                        <td>${product.price} €</td>
                        <td>${product.category}</td>
                        <td>${product.rating}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-edit" data-id="${product.product_id}">Edit</button>
                            <button class="btn btn-sm btn-danger btn-delete" data-id="${product.product_id}">Delete</button>
                        </td>
                    </tr>`;
                    $("#productTableBody").append(row);
                });
            }
        });
    }

});