$(document).ready(function () {

    // Prüffunktion beim Laden der Seite
    requireAdmin();
    loadProducts();
    let currentCustomerId = null;
    $("body").show();

    // Switch zu Add Product
    $("#btnShowAddProduct").click(function () {
        $("#addProductView").show();
        $("#productListView").hide();
        $("#customerListView").hide();
        $("#customerOrdersView").hide();

        $("#btnShowAddProduct").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowProductList").addClass("btn-outline-primary").removeClass("btn-primary");
        $("#btnShowCustomerList").addClass("btn-outline-primary").removeClass("btn-primary");
    });

    // Switch zu Product List
    $("#btnShowProductList").click(function () {
        $("#productListView").show();
        $("#addProductView").hide();
        $("#customerListView").hide();
        $("#customerOrdersView").hide();

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
        $("#customerOrdersView").hide();

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

    // Adresse bei Order Details formatieren
    function formatShippingAddress(shippingAddress) {
        if (!shippingAddress) {
            return "N/A";
        }

        try {
            let addressData = JSON.parse(shippingAddress);

            let address = addressData.address || "";
            let zip = addressData.zip || "";
            let city = addressData.city || "";

            return `${address}, ${zip} ${city}`;
        } catch (e) {
            return shippingAddress;
        }
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
                    if (customer.balance !== undefined && customer.balance !== null) {
                            $("#modalBalance").text(parseFloat(customer.balance).toFixed(2) + " €");
                        } else {
                            $("#modalBalance").text("0.00 €");
                        }

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

    // Event-Handler für View Orders
    $(document).on("click", ".btn-view-orders", function () {
        let userId = $(this).data("id");
        currentCustomerId = userId;
        let customerName = $(this).closest("tr").find("td").eq(2).text();

        $("#customerListView").hide();
        $("#productListView").hide();
        $("#addProductView").hide();
        $("#customerOrdersView").show();

        $("#customerOrdersTitle").text("Orders of " + customerName);

        loadCustomerOrders(userId);
    });

    // Zurück zur Customer List
    $("#btnBackToCustomerList").click(function () {
        $("#customerOrdersView").hide();
        $("#customerListView").show();
    });

    // Lädt alle Bestellungen eines ausgewählten Kunden
    function loadCustomerOrders(userId) {
        $.ajax({
            type: "POST",
            url: "../../backend/services/orderServiceHandler.php",
            data: {
                method: "getOrdersByCustomerForAdmin",
                userId: userId
            },
            dataType: "json",

            success: function (response) {
                $("#customerOrdersTableBody").empty();

                if (response.success) {
                    if (!response.data || response.data.length === 0) {
                        $("#customerOrdersTableBody").append(`
                        <tr>
                            <td colspan="5" class="text-center text-muted">
                                No orders found for this customer.
                            </td>
                        </tr>
                    `);
                        return;
                    }

                    response.data.forEach(function (order) {
                        let total = parseFloat(order.total).toFixed(2);

                        let row = `
                        <tr>
                            <td>${order.id}</td>
                            <td>${OrderUtils.formatOrderDate(order.created_at, true)}</td>
                            <td>${OrderUtils.renderOrderStatusBadge(order.status)}</td>
                            <td>${total} €</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-info text-white btn-view-order-detail" data-id="${order.id}">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    `;

                        $("#customerOrdersTableBody").append(row);
                    });
                } else {
                    alert(response.message);
                }
            },

            error: function (xhr) {
                console.error("Error loading customer orders:", xhr.responseText);
            }
        });
    }

    // Event-Handler für Order Details
        $(document).on("click", ".btn-view-order-detail", function () {
            let orderId = $(this).data("id");

            $.ajax({
                type: "POST",
                url: "../../backend/services/orderServiceHandler.php",
                data: {
                    method: "getOrderDetailsForAdmin",
                    orderId: orderId
                },
                dataType: "json",

                success: function (response) {
                    if (response.success) {
                        let order = response.data.order;
                        let items = response.data.items;

                        // Rabatt Styling: Grün geschrieben (text-success) statt rotem Badge
                        let discountVal = parseFloat(order.discount_amount);
                        let discountHtml = discountVal > 0
                            ? `<span class="text-success fw-bold">-${discountVal.toFixed(2)} €</span>`
                            : `<span>0.00 €</span>`;

                        // Zahlungsart & Details kombinieren (z.B. "CREDITCARD (************1234)")
                        let paymentDetailsHtml = "";
                        if (order.payment_method) {
                            paymentDetailsHtml = order.payment_method.toUpperCase();
                            if (order.payment_details) {
                                paymentDetailsHtml += ` (${order.payment_details})`;
                            }
                        } else {
                            paymentDetailsHtml = "<span class=\"text-muted\">N/A</span>";
                        }

                        let html = `
                        <h5 class="mb-3">Order #${order.id}</h5>

                        <table class="table table-sm table-borderless">
                            <tr>
                                <td class="fw-bold text-muted" style="width: 160px;">Customer:</td>
                                <td>${order.firstname} ${order.lastname}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Date:</td>
                                <td>${OrderUtils.formatOrderDate(order.created_at, true)}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Status:</td>
                                <td>${OrderUtils.renderOrderStatusBadge(order.status)}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Shipping address:</td>
                                <td>${formatShippingAddress(order.shipping_address)}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Payment method:</td>
                                <td>${paymentDetailsHtml}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Subtotal:</td>
                                <td>${parseFloat(order.subtotal).toFixed(2)} €</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Tax:</td>
                                <td>${parseFloat(order.tax_amount).toFixed(2)} €</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Discount:</td>
                                <td>${discountHtml}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold text-muted">Total:</td>
                                <td><strong>${parseFloat(order.total).toFixed(2)} €</strong></td>
                            </tr>
                        </table>

                        <h6 class="mt-4">Ordered Products</h6>
                        <table class="table table-striped table-sm">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit price</th>
                                    <th>Total</th>
                                    <th class="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                        items.forEach(function (item) {
                            html += `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>${item.quantity}</td>
                                <td>${parseFloat(item.unit_price).toFixed(2)} €</td>
                                <td>${parseFloat(item.item_total).toFixed(2)} €</td>
                                <td class="text-end">
                                    <button
                                        class="btn btn-sm btn-outline-danger btn-remove-order-item"
                                        data-order-id="${order.id}"
                                        data-item-id="${item.order_item_id}">
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        `;
                        });

                        html += `
                            </tbody>
                        </table>
                    `;

                        $("#orderDetailContent").html(html);

                        let modalElement = document.getElementById("orderDetailModal");
                        let modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
                        modalInstance.show();

                    } else {
                        alert(response.message);
                    }
                },

                error: function (xhr) {
                    console.error("Error loading order details:", xhr.responseText);
                }
            });
        });

    //Remove-Click-Handler
    $(document).on("click", ".btn-remove-order-item", function () {
        let orderId = $(this).data("order-id");
        let orderItemId = $(this).data("item-id");

        if (!confirm("Are you sure you want to remove this product from the order?")) {
            return;
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/orderServiceHandler.php",
            data: {
                method: "removeOrderItemFromOrder",
                orderId: orderId,
                orderItemId: orderItemId
            },
            dataType: "json",

            success: function (response) {
                if (response.success) {
                    $(".btn-view-order-detail[data-id='" + orderId + "']").click();

                    if (currentCustomerId) {
                        loadCustomerOrders(currentCustomerId);
                    }
                } else {
                    alert(response.message);
                }
            },

            error: function (xhr) {
                console.error("Error removing order item:", xhr.responseText);
                alert("Error connecting to the server.");
            }
        });
    });

    //Delete Product
    $(document).on("click", ".btn-delete", function () {
        let productId = $(this).data("id");

        if (confirm("Are you sure you want to delete this product?")) {
            $.ajax({
                type: "POST",
                url: "../../backend/services/productServiceHandler.php",
                data: { method: "deleteProduct", product_id: productId },
                dataType: "json",
                success: function (response) {
                    if (response.success) {
                        loadProducts();
                    } else {
                        alert(response.message);
                    }
                },
                error: function (xhr) {
                    console.error("Error deleting product:", xhr.responseText);
                }
            });
        }
    });

    //Edit Product lädt Daten von db und öffnet Modal
    $(document).on("click", ".btn-edit", function () {
        let productId = $(this).data("id");
        $.ajax({
            type: "POST",
            url: "../../backend/services/productServiceHandler.php",
            data: { method: "getProductById", product_id: productId },
            dataType: "json",
            success: function (product) {
                console.log(product);
                $("#editProductId").val(product.product_id);
                $("#editProductName").val(product.name);
                $("#editProductDescription").val(product.description);
                $("#editProductPrice").val(product.price);
                $("#editProductCategory").val(product.category);
                $("#editProductRating").val(product.rating);

                // Modal öffnen
                let modal = new bootstrap.Modal(document.getElementById("editProductModal"));
                modal.show();
            },
            error: function (xhr) {
                console.error("Error loading product:", xhr.responseText);
            }
        });
    });

    //Save Changes in edit Product Modul
    $("#btnSaveProduct").on("click", function () {
        let formData = new FormData();
        formData.append("method", "updateProduct");
        formData.append("product_id", $("#editProductId").val());
        formData.append("name", $("#editProductName").val());
        formData.append("description", $("#editProductDescription").val());
        formData.append("price", $("#editProductPrice").val());
        formData.append("category", $("#editProductCategory").val());
        formData.append("rating", $("#editProductRating").val());

        // Bild nur anhängen wenn eines ausgewählt wurde
        let imageFile = $("#editProductImage")[0].files[0];
        if (imageFile) {
            formData.append("image", imageFile);
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/productServiceHandler.php",
            data: formData,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    bootstrap.Modal.getInstance(document.getElementById("editProductModal")).hide();
                    loadProducts();
                } else {
                    alert(response.message);
                }
            },
            error: function (xhr) {
                console.error("Error updating product:", xhr.responseText);
            }
        });
    });

    //GUTSCHEINE VERWALTEN

    // Switch zu Voucher Management View
    $("#btnShowVoucherManagement").click(function () {
        $("#voucherManagementView").show();
        $("#productListView").hide();
        $("#addProductView").hide();
        $("#customerListView").hide();
        $("#customerOrdersView").hide();

        $("#btnShowVoucherManagement").addClass("btn-primary").removeClass("btn-outline-primary");
        $("#btnShowProductList").addClass("btn-outline-primary").removeClass("btn-primary");
        $("#btnShowAddProduct").addClass("btn-outline-primary").removeClass("btn-primary");
        $("#btnShowCustomerList").addClass("btn-outline-primary").removeClass("btn-primary");

        resetVoucherForm();
        loadVouchers();
    });

    // Erweitere die bestehenden drei Nav-Buttons, damit sie die Gutschein-View verstecken:
    $("#btnShowProductList, #btnShowAddProduct, #btnShowCustomerList, #btnBackToCustomerList").click(function() {
        $("#voucherManagementView").hide();
        $("#btnShowVoucherManagement").addClass("btn-outline-primary").removeClass("btn-primary");
    });

    // Code-Generierung via Backend (inklusive automatischer Datumsberechnung)
    $("#btnGenerateCode").click(function () {
        $.ajax({
            type: "POST",
            url: "../../backend/services/voucherServiceHandler.php",
            data: { method: "generateUniqueCode" },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#voucherCodeInput").val(response.code);

                    // Datumsfelder befüllen (Zentral aus Backend geholt, um Asynchronität zu vermeiden)
                    $("#voucherStart").val(response.created_at);
                    $("#voucherExpiry").val(response.expires_at);

                    // Button zum Erstellen freigeben
                    $("#btnCreateVoucher").prop("disabled", false);
                    $("#voucherMessage").text("");
                } else {
                    $("#voucherMessage").text(response.message).css("color", "red");
                }
            },
            error: function (xhr) {
                console.error("Error generating code:", xhr.responseText);
                $("#voucherMessage").text("Server Error generating code.").css("color", "red");
            }
        });
    });

    // Gutschein absenden & anlegen
    $("#createVoucherForm").submit(function (e) {
        e.preventDefault();

        let formData = {
            method: "createVoucher",
            code: $("#voucherCodeInput").val(),
            initial_value: $("#voucherValue").val(),
            created_at: $("#voucherStart").val(),
            expires_at: $("#voucherExpiry").val()
        };

        $.ajax({
            type: "POST",
            url: "../../backend/services/voucherServiceHandler.php",
            data: formData,
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#voucherMessage").text(response.message).css("color", "green");
                    resetVoucherForm();
                    loadVouchers(); // Tabelle aktualisieren
                } else {
                   $("#voucherMessage").text(response.message).css("color", "red");
                }
            },
            error: function (xhr) {
                console.error("Error creating voucher:", xhr.responseText);
                $("#voucherMessage").text("Server Error when creating voucher.").css("color", "red");
            }
        });
    });

    // Gutscheine aus der DB laden und auflisten
    function loadVouchers() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/voucherServiceHandler.php",
            data: { method: "getAllVouchers" },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#voucherTableBody").empty();

                    response.data.forEach(function (voucher) {
                        let statusBadge = "";

                        // Status ermitteln
                        let expiryDate = new Date(voucher.expires_at);
                        let now = new Date();

                        if (parseInt(voucher.is_redeemed) === 1) {
                            statusBadge = `<span class="badge bg-secondary">Redeemed</span>`;
                        } else if (expiryDate < now) {
                            statusBadge = `<span class="badge bg-danger">Expired</span>`;
                        } else {
                            statusBadge = `<span class="badge bg-success">Active</span>`;
                        }

                        let value = parseFloat(voucher.initial_value).toFixed(2);

                        let row = `
                            <tr>
                                <td><code class="fw-bold text-dark fs-6">${voucher.code}</code></td>
                                <td>${value} €</td>
                                <td>${OrderUtils.formatOrderDate(voucher.created_at, false)}</td>
                                <td>${OrderUtils.formatOrderDate(voucher.expires_at, false)}</td>
                                <td>${statusBadge}</td>
                            </tr>
                        `;
                        $("#voucherTableBody").append(row);
                    });
                } else {
                    console.error("Could not load vouchers:", response.message);
                }
            },
            error: function (xhr) {
                console.error("Error loading vouchers:", xhr.responseText);
            }
        });
    }

    // Hilfsfunktion zum Leeren der Maske
    function resetVoucherForm() {
        $("#createVoucherForm")[0].reset();
        $("#btnCreateVoucher").prop("disabled", true);
    }

});