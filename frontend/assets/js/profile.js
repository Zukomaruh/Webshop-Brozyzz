$(document).ready(function () {
    let currentProfileData = null;

    loadUserProfile();

    const params = new URLSearchParams(window.location.search);
    const activeTab = params.get("tab");

    if (activeTab === "orders") {
        resetProfileFormToSavedData()
        showMyOrdersTab();
        loadOrders();
    }

    // Tab-Wechsel zwsichen Profildaten und Bestellungen
    $(document).on("click", "#tabPersonalInfo", function (e) {
        e.preventDefault();
        showPersonalInfoTab();
    });

    $(document).on("click", "#tabMyOrders", function (e) {
        e.preventDefault();
        resetProfileFormToSavedData()
        showMyOrdersTab();

        loadOrders();
    });

    // Sichtbarkeit der Profil- und Bestellbereiche
    function showPersonalInfoTab() {
        $("#tabPersonalInfo").addClass("active");
        $("#tabMyOrders").removeClass("active");

        $("#personalInfoSection").removeClass("d-none");
        $("#myOrdersSection").addClass("d-none");

        $("#btnToggleEdit").removeClass("d-none");
        $("#profileMessage").addClass("d-none");
    }

    function showMyOrdersTab() {
        $("#tabMyOrders").addClass("active");
        $("#tabPersonalInfo").removeClass("active");

        $("#myOrdersSection").removeClass("d-none");
        $("#personalInfoSection").addClass("d-none");

        $("#btnToggleEdit").addClass("d-none");
        $("#profileMessage").addClass("d-none");
    }




    //      TAB PERSONAL INFORMATION

    //Profildaten laden und anzeigen
    function loadUserProfile() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: { method: "getUserProfile" },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    currentProfileData = response.data;
                    fillFormFields(currentProfileData);
                } else {
                    showMessage(response.message, "danger");
                }
            },
            error: function () {
                showMessage("Error connecting to the server.", "danger");
            }
        });
    }

    function fillFormFields(user) {
        $("#gender").val(user.gender);
        $("#firstName").val(user.firstname);
        $("#lastName").val(user.lastname);
        $("#username").val(user.username);
        $("#email").val(user.email);
        $("#address").val(user.address);
        $("#zip").val(user.zip);
        $("#city").val(user.city);
        $("#paymentMethod").val(user.payment_method);

        if (user.payment_method === "creditcard") {
            $("#paymentDetails").val(getMaskedCreditCardDisplay(user.payment_details));
        } else {
            $("#paymentDetails").val(user.payment_details);
        }

        toggleCreditCardDisplay(user.payment_method);
    }

    function maskCreditCard(cardNumber) {
        return "****";
    }

    function getMaskedCreditCardDisplay(cardNumber) {
        if (!cardNumber) return "****";
        return maskCreditCard(cardNumber);
    }

    // Edit Profile Clicked
    $("#btnToggleEdit").click(function () {
        $("#profileForm").find('input, select').prop('disabled', false);

        if ($("#paymentMethod").val() === "creditcard") {
            $("#paymentDetails").val('').attr("placeholder", "Enter new card number or leave empty to keep current");
            $("#paymentDetails").prop('required', false);
        }
        enableAdditionalPaymentEditMode();

        // Tausche Attrappe gegen echte Eingabefelder aus
        $("#dummyPasswordGroup").attr("style", "display: none !important;");
        $("#passwordChangeGroup").attr("style", "display: block !important;");

        // Zeige restliche Kontrollbereiche
        $("#actionButtons").attr("style", "display: flex !important;");
        $("#passwordConfirmGroup").attr("style", "display: block !important;");

        // Inputs leeren/vorbereiten
        $("#newPassword").val('');
        $("#confirmNewPassword").val('');
        $("#passwordConfirm").prop('required', true).val('');

        $(this).addClass("d-none");
        $("#profileMessage").addClass("d-none");
    });

    $("#btnCancelEdit").click(function () {
        resetProfileFormToSavedData();
    });

    $("#paymentMethod").change(function () {
        toggleCreditCardDisplay($(this).val());
        if ($(this).val() === "creditcard" && !$(this).is(':disabled')) {
            $("#paymentDetails").attr("placeholder", "Enter card number").prop('required', true);
        }
    });

    function toggleCreditCardDisplay(method) {
        if (method === "creditcard") {
            $("#cardGroup").show();
        } else {
            $("#cardGroup").hide().find('input').prop('required', false).val('');
        }
    }

    function enableAdditionalPaymentEditMode() {
        $(".additional-payment-method").prop('disabled', false);
        $(".additional-payment-details")
            .val('')
            .attr("placeholder", "Enter new card number or leave empty to keep current")
            .prop('required', false);
        $(".additional-payment-method").each(function () {
            toggleAdditionalCreditCardDisplay($(this));
        });
    }

    function setAdditionalPaymentViewMode() {
        $(".additional-payment-method").prop('disabled', true);
        $(".additional-payment-details")
            .val(getMaskedCreditCardDisplay())
            .attr("placeholder", "")
            .prop('disabled', true)
            .prop('required', false);
        $(".additional-card-group").hide();
        $(".additional-payment-method").each(function () {
            if ($(this).val() === "creditcard") {
                $(this).closest(".additional-payment-row").find(".additional-card-group").show();
            }
        });
    }

    function toggleAdditionalCreditCardDisplay(selectElement) {
        let row = selectElement.closest(".additional-payment-row");
        let detailsInput = row.find(".additional-payment-details");

        if (selectElement.val() === "creditcard") {
            let hasExistingCreditCard = selectElement.data("original-method") === "creditcard";
            row.find(".additional-card-group").show();
            detailsInput
                .attr("placeholder", hasExistingCreditCard ? "Enter new card number or leave empty to keep current" : "Enter card number")
                .prop('disabled', false)
                .prop('required', !hasExistingCreditCard);
        } else {
            row.find(".additional-card-group").hide();
            detailsInput
                .val('')
                .prop('disabled', false)
                .prop('required', false);
        }
    }

    function collectAdditionalPaymentMethods() {
        let paymentMethods = [];

        $(".additional-payment-method").each(function () {
            let select = $(this);
            let row = select.closest(".additional-payment-row");

            paymentMethods.push({
                id: select.data("payment-id"),
                paymentMethod: select.val(),
                details: row.find(".additional-payment-details").val().trim()
            });
        });

        return paymentMethods;
    }

    function switchToViewMode() {
        $("#profileForm").find('input, select').prop('disabled', true);
        $("#paymentDetails").attr("placeholder", "");
        setAdditionalPaymentViewMode();

        // Tausche echte Eingabefelder wieder zurück gegen die Attrappe
        $("#passwordChangeGroup").attr("style", "display: none !important;");
        $("#dummyPasswordGroup").attr("style", "display: block !important;");

        // Verstecke Kontrollbereiche
        $("#actionButtons").attr("style", "display: none !important;");
        $("#passwordConfirmGroup").attr("style", "display: none !important;");

        $("#newPassword").val('');
        $("#confirmNewPassword").val('');
        $("#passwordConfirm").prop('required', false).val('');

        $("#btnToggleEdit").removeClass("d-none");
    }

    //Verhindert, dass nicht gespeicherte Daten in den Feldern bleiben
    function resetProfileFormToSavedData() {
        if (currentProfileData) {
            fillFormFields(currentProfileData);
        }

        switchToViewMode();
    }


    // Submit Form
    $("#profileForm").submit(function (e) {
        e.preventDefault();

        let newPassword = $("#newPassword").val();
        let confirmNewPassword = $("#confirmNewPassword").val();

        // NEU: Zeigt dem User eine Fehlermeldung, wenn Passwörter ungleich sind
        if (newPassword !== "" || confirmNewPassword !== "") {
            if (newPassword !== confirmNewPassword) {
                showMessage("New passwords do not match! Please check your input.", "danger");
                $("#confirmNewPassword").val('').focus();
                return;
            }
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: {
                method: "updateUserProfile",
                gender: $("#gender").val(),
                firstName: $("#firstName").val(),
                lastName: $("#lastName").val(),
                username: $("#username").val(),
                email: $("#email").val(),
                address: $("#address").val(),
                zip: $("#zip").val(),
                city: $("#city").val(),
                paymentMethod: $("#paymentMethod").val(),
                paymentDetails: $("#paymentDetails").val(),
                additionalPaymentMethods: collectAdditionalPaymentMethods(),
                passwordConfirm: $("#passwordConfirm").val(),
                newPassword: newPassword
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showMessage(response.message, "success");
                    loadUserProfile();
                    loadAdditionalPaymentMethods();
                    switchToViewMode();
                } else {
                    showMessage(response.message, "danger");
                    $("#passwordConfirm").val('').focus();
                }
            },
            error: function (xhr) {
                console.error("Server Error:", xhr.responseText);
                showMessage("Error saving profile changes.", "danger");
            }
        });
    });

    function showMessage(text, type) {
        $("#profileMessage")
            .text(text)
            .removeClass("d-none alert-danger alert-success")
            .addClass("alert-" + type);
    }





    //      TAB MY ORDERS

    // Bestellungen laden und in der Tabelle anzeigen
    function loadOrders() {
        $.ajax({
            type: "GET",
            url: "../../backend/services/orderServiceHandler.php",
            cache: false,
            data: {
                method: "getOrders"
            },
            dataType: "json",

            success: function (response) {
                console.log(response);

                if (response.error === "not_logged_in") {
                    $("#ordersTableWrapper").addClass("d-none");
                    $("#ordersMsg").html(`
                    <div class="alert alert-warning">
                        Please log in to view your orders.
                    </div>
                `);
                    return;
                }

                if (response.success) {
                    displayOrders(response.orders);
                } else {
                    $("#ordersTableWrapper").addClass("d-none");
                    $("#ordersMsg").html(`
                    <div class="alert alert-danger">
                        Orders could not be loaded.
                    </div>
                `);
                }
            },

            error: function (xhr) {
                console.error("Order loading error:", xhr.responseText);

                $("#ordersTableWrapper").addClass("d-none");
                $("#ordersMsg").html(`
                <div class="alert alert-danger">
                    Error connecting to the server.
                </div>
            `);
            }
        });
    }

    function displayOrders(orders) {
        let ordersTableBody = $("#ordersTableBody");
        ordersTableBody.empty();
        $("#ordersMsg").empty();

        if (!orders || orders.length === 0) {
            $("#ordersTableWrapper").addClass("d-none");
            $("#ordersMsg").html(`
            <div class="alert alert-info">
                You have not placed any orders yet.
            </div>
        `);
            return;
        }

        $("#ordersTableWrapper").removeClass("d-none");

        orders.forEach(function (order) {
            let formattedDate = OrderUtils.formatOrderDate(order.created_at);
            let formattedTotal = parseFloat(order.total).toFixed(2);
            let statusInfo = OrderUtils.getStatusInfo(order.status);

            let row = `
            <tr>
                <td>#${order.id}</td>
                <td>${formattedDate}</td>
                <td>${formattedTotal} €</td>
                <td>
                    <span class="badge ${statusInfo.badgeClass}">
                        ${statusInfo.text}
                    </span>
                </td>
                <td>
                    <div class="d-flex gap-2 justify-content-start">
                        <button class="btn btn-outline-primary btn-sm btn-view-order"
                                data-order-id="${order.id}">
                            View Details
                        </button>

                        <button class="btn btn-outline-secondary btn-sm btn-print-invoice"
                                data-order-id="${order.id}">
                            Print Invoice
                        </button>
                    </div>
                </td>
            </tr>
        `;

            ordersTableBody.append(row);
        });
    }

    // Hilfsfunktionen für Bestelldatum
    function formatOrderDate(dateString) {
        if (!dateString) {
            return "-";
        }

        let datePart = dateString.substring(0, 10);
        let parts = datePart.split("-");

        if (parts.length !== 3) {
            return dateString;
        }

        return parts[2] + "." + parts[1] + "." + parts[0];
    }

    // Hilfsfunktion für Bestellstatus
    function getStatusInfo(status) {
        switch (status) {
            case "pending":
                return {
                    text: "Pending",
                    badgeClass: "bg-warning"
                };

            case "processing":
                return {
                    text: "Processing",
                    badgeClass: "bg-info"
                };

            case "shipped":
                return {
                    text: "Shipped",
                    badgeClass: "bg-primary"
                };

            case "delivered":
                return {
                    text: "Delivered",
                    badgeClass: "bg-success"
                };

            case "cancelled":
                return {
                    text: "Cancelled",
                    badgeClass: "bg-danger"
                };

            case "refunded":
                return {
                    text: "Refunded",
                    badgeClass: "bg-secondary"
                };

            default:
                return {
                    text: status,
                    badgeClass: "bg-dark"
                };
        }
    }
    $(document).on("click", ".btn-print-invoice", function () {
        let orderId = $(this).data("order-id");
        window.open("invoice.html?order_id=" + orderId, "_blank");
    });

    $(document).on("click", ".btn-view-order", function () {
        let orderId = $(this).data("order-id");
        window.location.href = "orderDetails.html?order_id=" + orderId;
    });

    //Add Payment
    loadAdditionalPaymentMethods();

    function loadAdditionalPaymentMethods() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: { method: "getPaymentMethods" },
            dataType: "json",
            success: function (response) {
                if (!response.success) return;

                let container = $("#additionalPaymentMethodsList");
                container.empty();

                // Nur nicht-default anzeigen (default ist schon oben sichtbar)
                let extras = response.data.filter(p => p.is_default == 0);

                if (extras.length === 0) {
                    container.html('<p class="text-muted small mb-0">No additional payment methods saved.</p>');
                    return;
                }

                extras.forEach(function (pm, index) {
                    let details = pm.method === 'creditcard'
                        ? getMaskedCreditCardDisplay(pm.details)
                        : '';
                    let methodId = 'additionalPaymentMethod' + index;
                    let detailsId = 'additionalPaymentDetails' + index;
                    let cardColumnStyle = pm.method === 'creditcard' ? '' : ' style="display:none;"';

                    container.append(`
                        <div class="row mb-3 g-2 additional-payment-row">
                            <div class="col-md-5">
                                <label for="${methodId}" class="form-label">Additional Payment Method</label>
                                <select class="form-select additional-payment-method" id="${methodId}" data-payment-id="${pm.id}" data-original-method="${pm.method}" disabled>
                                    <option value="invoice" ${pm.method === 'invoice' ? 'selected' : ''}>Invoice</option>
                                    <option value="creditcard" ${pm.method === 'creditcard' ? 'selected' : ''}>Credit Card</option>
                                </select>
                            </div>
                            <div class="col-md-5 additional-card-group"${cardColumnStyle}>
                                <label for="${detailsId}" class="form-label">Credit Card Number</label>
                                <input type="text" class="form-control additional-payment-details" id="${detailsId}" value="${escapeHtml(details)}" disabled>
                            </div>
                            <div class="col-auto d-flex align-items-end">
                                <button type="button" class="btn btn-outline-danger btn-sm btn-delete-payment-method" data-payment-id="${pm.id}">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `);
                });
            }
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    $("#btnAddPaymentMethod").click(function () {
        $("#addPaymentMethodForm").show();
        $("#btnAddPaymentMethod").hide();
        $("#addPaymentMsg").hide();
        $("#addPaymentMethodForm").find('input, select').prop('disabled', false);
        $("#newPaymentMethodSelect").val('');
        $("#newPaymentDetails").val('');
        toggleNewCreditCardDisplay('');
    });

    $("#btnCancelNewPayment").click(function () {
        $("#addPaymentMethodForm").hide();
        $("#btnAddPaymentMethod").show();
        $("#newPaymentMethodSelect").val('');
        $("#newPaymentDetails").val('');
        toggleNewCreditCardDisplay('');
    });

    $("#newPaymentMethodSelect").change(function () {
        toggleNewCreditCardDisplay($(this).val());
    });

    $(document).on("change", ".additional-payment-method", function () {
        toggleAdditionalCreditCardDisplay($(this));
    });

    $(document).on("click", ".btn-delete-payment-method", function () {
        let paymentId = $(this).data("payment-id");

        if (!confirm("Delete this payment method?")) {
            return;
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: {
                method: "deletePaymentMethod",
                paymentId: paymentId
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showAddPaymentMsg(response.message, "success");
                    loadAdditionalPaymentMethods();
                } else {
                    showAddPaymentMsg(response.message, "danger");
                }
            },
            error: function () {
                showAddPaymentMsg("Server error.", "danger");
            }
        });
    });

    function toggleNewCreditCardDisplay(method) {
        if (method === "creditcard") {
            $("#newCardDetailsGroup").show();
            $("#newPaymentDetails")
                .attr("placeholder", "Enter card number")
                .prop('required', true);
        } else {
            $("#newCardDetailsGroup").hide();
            $("#newPaymentDetails")
                .prop('required', false)
                .val('');
        }
    }

    $("#btnSaveNewPayment").click(function () {
        let method  = $("#newPaymentMethodSelect").val();
        let details = $("#newPaymentDetails").val().trim();

        if (!method) {
            showAddPaymentMsg("Please select a payment method.", "danger");
            return;
        }
        if (method === 'creditcard' && !details) {
            showAddPaymentMsg("Please enter your card number.", "danger");
            return;
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: { method: "addPaymentMethod", paymentMethod: method, details: details },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showAddPaymentMsg(response.message, "success");
                    loadAdditionalPaymentMethods();
                    setTimeout(function () {
                        $("#addPaymentMethodForm").hide();
                        $("#btnAddPaymentMethod").show();
                        $("#addPaymentMsg").hide();
                    }, 1500);
                } else {
                    showAddPaymentMsg(response.message, "danger");
                }
            },
            error: function () {
                showAddPaymentMsg("Server error.", "danger");
            }
        });
    });

    function showAddPaymentMsg(text, type) {
        $("#addPaymentMsg")
            .text(text)
            .removeClass("alert alert-danger alert-success")
            .addClass("alert alert-" + type)
            .show();
    }
});
