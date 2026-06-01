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

        if (user.payment_method === "creditcard" && user.payment_details) {
            let maskedCard = maskCreditCard(user.payment_details);
            $("#paymentDetails").val(maskedCard);
        } else {
            $("#paymentDetails").val(user.payment_details);
        }

        toggleCreditCardDisplay(user.payment_method);
    }

    function maskCreditCard(cardNumber) {
        let cleaned = cardNumber.replace(/\s+/g, '');
        if (cleaned.length < 4) return "****";
        let lastFour = cleaned.slice(-4);
        return "*".repeat(cleaned.length - 4) + lastFour;
    }

    // Edit Profile Clicked
    $("#btnToggleEdit").click(function () {
        $("#profileForm").find('input, select').prop('disabled', false);

        if ($("#paymentMethod").val() === "creditcard") {
            $("#paymentDetails").val('').attr("placeholder", "Enter new card number or leave empty to keep current");
            $("#paymentDetails").prop('required', false);
        }

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

    function switchToViewMode() {
        $("#profileForm").find('input, select').prop('disabled', true);
        $("#paymentDetails").attr("placeholder", "");

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
                passwordConfirm: $("#passwordConfirm").val(),
                newPassword: newPassword
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showMessage(response.message, "success");
                    loadUserProfile();
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
            let formattedDate = formatOrderDate(order.created_at);
            let formattedTotal = parseFloat(order.total).toFixed(2);
            let statusInfo = getStatusInfo(order.status);

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
});