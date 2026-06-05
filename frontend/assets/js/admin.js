$(document).ready(function () {

    // Prüffunktion beim Laden der Seite
    requireAdmin();
    loadProducts();
    $("body").show();

    // Switch zu Add Product
    $("#btnShowAddProduct").click(function () {
        $("#addProductView").show();
        $("#productListView").hide();
        $("#customerListView").hide();

        $("#btnShowAddProduct").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowProductList").addClass("btn-outline-primary").removeClass("btn-primary");
        $("#btnShowCustomerList").addClass("btn-outline-primary").removeClass("btn-primary");
    });

    // Switch zu Product List
    $("#btnShowProductList").click(function () {
        $("#productListView").show();
        $("#addProductView").hide();
        $("#customerListView").hide();

        $("#btnShowProductList").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowAddProduct").addClass("btn-outline-primary").removeClass("btn-primary");
        $("#btnShowCustomerList").addClass("btn-outline-primary").removeClass("btn-primary");

        // nicht zwingend notwendig
        loadProducts();
    });

    // Switch zu Customer List
    $("#btnShowCustomerList").click(function () {
        $("#customerListView").show();
        $("#productListView").hide();
        $("#addProductView").hide();

        $("#btnShowCustomerList").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowProductList").addClass("btn-outline-primary").removeClass("btn-primary");
        $("#btnShowAddProduct").addClass("btn-outline-primary").removeClass("btn-primary");

        loadCustomers();
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
                $("#productMessage").text("Server-Error when saving.").css("color", "red");
            }
        });
    });

    // Lädt Produkte
    function loadProducts() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/productServiceHandler.php",
            data: { method: "getAllProducts" },

            success: function (products) {
                $("#productTableBody").empty();

                products.forEach(function (product) {
                    let row = `
                        <tr>
                            <td>${product.product_id}</td>
                            <td>
                                <img src="../../backend/productpictures/${product.image}" height="50">
                            </td>
                            <td>${product.description}</td>
                            <td>${product.price} €</td>
                            <td>${product.category}</td>
                            <td>${product.rating}</td>
                            <td>
                                <button class="btn btn-sm btn-warning btn-edit" data-id="${product.product_id}">Edit</button>
                                <button class="btn btn-sm btn-danger btn-delete" data-id="${product.product_id}">Delete</button>
                            </td>
                        </tr>
                    `;
                    $("#productTableBody").append(row);
                });
            }
        });
    }

    // Lädt Kundenliste
    function loadCustomers() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            data: { method: "getAllCustomers" },
            dataType: "json",

            success: function (response) {
                if (response.success) {
                    $("#customerTableBody").empty();

                    response.data.forEach(function (customer) {
                        let title = customer.gender === "mr" ? "Mr." : (customer.gender === "ms" ? "Ms." : "Diverse");

                        // Status Badge Farbe bestimmen
                        let statusBadge = customer.status === "active"
                            ? `<span class="badge bg-success">Active</span>`
                            : `<span class="badge bg-danger">Inactive</span>`;

                        // Deaktivieren-Button deaktivieren, wenn User Admin ist
                        let disableBtnAttr = customer.role === "admin" ? "disabled" : "";
                        let deactivateBtnText = customer.status === "active" ? "Deactivate" : "Activate";
                        let deactivateBtnClass = customer.status === "active" ? "btn-outline-danger" : "btn-success";

                        let row = `
                            <tr>
                                <td>${customer.user_id}</td>
                                <td><strong>${customer.username}</strong></td>
                                <td>${title} ${customer.firstname} ${customer.lastname}</td>
                                <td>${customer.email}</td>
                                <td>${statusBadge}</td>
                                <td class="text-end">
                                    <div class="btn-group gap-1">
                                        <button class="btn btn-sm btn-info text-white btn-view-customer" data-id="${customer.user_id}">
                                            View Details
                                        </button>
                                        <button class="btn btn-sm btn-warning btn-view-orders" data-id="${customer.user_id}">
                                            View Orders
                                        </button>
                                        <button class="btn btn-sm ${deactivateBtnClass} btn-toggle-status" data-id="${customer.user_id}" data-status="${customer.status}" ${disableBtnAttr}>
                                            ${deactivateBtnText}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                        $("#customerTableBody").append(row);
                    });
                } else {
                    alert(response.message);
                }
            },
            error: function (xhr) {
                console.error("Error loading customers:", xhr.responseText);
            }
        });
    }

    // Event-Handler für den Aktivieren/Deaktivieren-Button
    $(document).on("click", ".btn-toggle-status", function () {
        let userId = $(this).data("id");
        let currentStatus = $(this).data("status");
        let newStatus = currentStatus === "active" ? "inactive" : "active";

        if (confirm(`Are you sure you want to set this customer to ${newStatus}?`)) {
            $.ajax({
                type: "POST",
                url: "../../backend/services/userServiceHandler.php",
                data: {
                    method: "toggleCustomerStatus",
                    userId: userId,
                    status: newStatus
                },
                dataType: "json",
                success: function (response) {
                    if (response.success) {
                        loadCustomers();
                    } else {
                        alert(response.message);
                    }
                },
                error: function (xhr) {
                    console.error("Error changing status:", xhr.responseText);
                }
            });
        }
    });

    // Event-Handler für View Details Modal
    $(document).on("click", ".btn-view-customer", function () {
        let userId = $(this).data("id");

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            data: {
                method: "getUserDetailsForAdmin",
                userId: userId
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    let customer = response.data;
                    let title = customer.gender === "mr" ? "Mr." : (customer.gender === "ms" ? "Ms." : "Diverse");

                    $("#modalUsername").text(customer.username);
                    $("#modalFullName").text(`${title} ${customer.firstname} ${customer.lastname}`);
                    $("#modalEmail").text(customer.email);
                    $("#modalAddress").text(customer.address);
                    $("#modalCityZip").text(`${customer.zip} ${customer.city}`);
                    $("#modalPaymentMethod").text(customer.payment_method ? customer.payment_method.toUpperCase() : "N/A");

                    // REPARIERT: Nativer Bootstrap 5 Aufruf (umgeht den jQuery-Plugin-Fehler)
                    let modalElement = document.getElementById('customerDetailModal');
                    let modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
                    modalInstance.show();

                } else {
                    alert(response.message);
                }
            },
            error: function (xhr) {
                console.error("Error loading customer details:", xhr.responseText);
            }
        });
    });

});