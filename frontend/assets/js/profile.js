$(document).ready(function () {
    let currentProfileData = null;

    // Zentraler Status für den Profil-Bearbeitungsmodus.
    // Dieser Status gilt für alle Profiländerungen, also auch für zusätzliche Zahlungsmethoden.
    let profileEditMode = false;

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

        updatePaymentActionButtons();
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
                    updatePaymentActionButtons();
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

        //Guthaben einfügen und auf 2 Nachkommastellen formatieren
        if (user.balance !== undefined && user.balance !== null) {
            $("#balance").val(parseFloat(user.balance).toFixed(2));
        } else {
            $("#balance").val("0.00");
        }

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

    // Enables editing for profile data and payment methods.
    // Existing credit card numbers are cleared in the input fields so they are not exposed.
    function enterProfileEditMode() {
        profileEditMode = true;

        $("#profileForm").find('input, select').prop('disabled', false);
        $("#balance").prop('disabled', true);

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

        $("#btnToggleEdit").addClass("d-none");
        $("#profileMessage").addClass("d-none");

        updatePaymentActionButtons();
    }

    // Deaktiviert den Bearbeitungsmodus und setzt die Ansicht zurück.
    function exitProfileEditMode() {
        profileEditMode = false;

        $("#profileForm").find("input, select").prop("disabled", true);
        $("#paymentDetails").attr("placeholder", "");

        setAdditionalPaymentViewMode();

        // Sicherstellen, dass das Guthaben-Feld immer gesperrt bleibt
        $("#balance").prop("disabled", true);

        // Tausche echte Eingabefelder wieder zurück gegen die Attrappe
        $("#passwordChangeGroup").attr("style", "display: none !important;");
        $("#dummyPasswordGroup").attr("style", "display: block !important;");

        // Verstecke Kontrollbereiche
        $("#actionButtons").attr("style", "display: none !important;");
        $("#passwordConfirmGroup").attr("style", "display: none !important;");

        $("#newPassword").val("");
        $("#confirmNewPassword").val("");
        $("#passwordConfirm").prop("required", false).val("");

        $("#btnToggleEdit").removeClass("d-none");

        updatePaymentActionButtons();
    }

    // Zeigt oder versteckt Add/Delete Buttons für zusätzliche Zahlungsmethoden.
    // Wichtig: Delete-Buttons werden dynamisch erzeugt, daher wird diese Funktion nach jedem Laden der Zahlungsmethoden aufgerufen.
    function updatePaymentActionButtons() {
        $("#btnAddPaymentMethod").toggleClass("d-none", !profileEditMode);
        $(".btn-delete-payment-method").toggleClass("d-none", !profileEditMode);
    }

    // Edit Profile Clicked
    $("#btnToggleEdit").click(function () {
        enterProfileEditMode();
    });

    $("#btnCancelEdit").click(function () {
        resetProfileFormToSavedData();
    });

    $("#paymentMethod").change(function () {
        toggleCreditCardDisplay($(this).val());

        if ($(this).val() === "creditcard" && !$(this).is(":disabled")) {
            $("#paymentDetails")
                .attr("placeholder", "Enter card number")
                .prop("required", true);
        }
    });


    function toggleCreditCardDisplay(method) {
        if (method === "creditcard") {
            $("#cardGroup").show();
        } else {
            $("#cardGroup").hide().find('input').prop('required', false).val('');
        }
    }

    // Enables editing for already saved additional payment methods.
    // Existing credit card numbers are not shown again and can be replaced by entering a new number.
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

    // Restores the read-only view for additional payment methods.
    // Credit card details are shown only as masked placeholders.
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

    // Collects existing and newly added payment methods for the profile save request.
    // Newly added rows are sent with the temporary payment id "new".
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
        exitProfileEditMode();
    }

    //Verhindert, dass nicht gespeicherte Daten in den Feldern bleiben
    function resetProfileFormToSavedData() {
        if (currentProfileData) {
            fillFormFields(currentProfileData);
        }

        switchToViewMode();

        // Entfernt auch neu hinzugefügte, aber nicht gespeicherte Payment-Method-Zeilen.
        loadAdditionalPaymentMethods();
    }


    // Submit Form
    $("#profileForm").submit(function (e) {
        e.preventDefault();

        let newPassword = $("#newPassword").val();
        let confirmNewPassword = $("#confirmNewPassword").val();

        // Zeigt dem User eine Fehlermeldung, wenn Passwörter ungleich sind
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
                    switchToViewMode();
                    loadUserProfile();
                    loadAdditionalPaymentMethods();
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

    $(document).on("click", ".btn-print-invoice", function () {
        let orderId = $(this).data("order-id");
        window.open("invoice.html?order_id=" + orderId, "_blank");
    });

    $(document).on("click", ".btn-view-order", function () {
        let orderId = $(this).data("order-id");
        window.location.href = "orderDetails.html?order_id=" + orderId;
    });




    // PAYMENT METHODS

    // Zusätzliche Zahlungsmethoden laden.
    // Danach wird sichergestellt, dass Add/Delete im View Mode nicht sichtbar sind.
    loadAdditionalPaymentMethods();
    updatePaymentActionButtons();

    // Loads all additional payment methods of the logged-in user.
    // The default payment method is loaded separately from the user profile.
    function loadAdditionalPaymentMethods() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: { method: "getPaymentMethods" },
            dataType: "json",
            success: function (response) {
                if (!response.success) {
                    updatePaymentActionButtons()
                    return;
                }

                let container = $("#additionalPaymentMethodsList");
                container.empty();

                // Alle Methoden, die vom Backend kommen, sind zusätzliche Zahlungsmethoden.
                // Die Default-Methode steht bereits oben im Profil und kommt aus der users-Tabelle.
                let paymentMethods = response.data;

                if (!paymentMethods || paymentMethods.length === 0) {
                    container.html('<p class="text-muted small mb-0">No additional payment methods saved.</p>');
                    updatePaymentActionButtons();
                    return;
                }

                paymentMethods.forEach(function (pm, index) {
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
                            <select class="form-select additional-payment-method"
                                    id="${methodId}"
                                    data-payment-id="${pm.id}"
                                    data-original-method="${pm.method}"
                                    disabled>
                                <option value="invoice" ${pm.method === "invoice" ? "selected" : ""}>Invoice</option>
                                <option value="creditcard" ${pm.method === "creditcard" ? "selected" : ""}>Credit Card</option>
                            </select>
                        </div>

                        <div class="col-md-5 additional-card-group"${cardColumnStyle}>
                            <label for="${detailsId}" class="form-label">Credit Card Number</label>
                            <input type="text"
                                   class="form-control additional-payment-details"
                                   id="${detailsId}"
                                   value="${escapeHtml(details)}"
                                   disabled>
                        </div>

                        <div class="col-auto d-flex align-items-end">
                            <button type="button"
                                    class="btn btn-outline-danger btn-sm btn-delete-payment-method d-none"
                                    data-payment-id="${pm.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                `);
                });

                updatePaymentActionButtons();
            },
            error: function () {
                updatePaymentActionButtons();
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
        // Zusätzliche Zahlungsmethoden dürfen nur im Profil-Edit-Mode hinzugefügt werden.
        if (!profileEditMode) {
            return;
        }

        addNewPaymentMethodRow();
    });

    $(document).on("change", ".additional-payment-method", function () {
        toggleAdditionalCreditCardDisplay($(this));
    });

    // Deletes an existing payment method immediately.
    // This action requires the current password and an additional confirmation dialog.
    $(document).on("click", ".btn-delete-payment-method", function () {
        // Zusätzliche Zahlungsmethoden dürfen nur im Profil-Edit-Mode gelöscht werden.
        if (!profileEditMode) {
            return;
        }

        if ($("#passwordConfirm").val().trim() === "") {
            showMessage("Please enter your current password before deleting a payment method.", "danger");
            $("#passwordConfirm").focus();
            return;
        }

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
                paymentId: paymentId,
                passwordConfirm: $("#passwordConfirm").val()
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showMessage(response.message, "success");
                    loadAdditionalPaymentMethods();
                } else {
                    showMessage(response.message, "danger");
                }
            },
            error: function () {
                showMessage("Server error.", "danger");
            }
        });
    });

    // Fügt eine neue, noch nicht gespeicherte Zahlungsmethode in die Profilansicht ein.
    // Gespeichert wird sie erst über den großen "Save Changes"-Button unten.
    function addNewPaymentMethodRow() {
        let container = $("#additionalPaymentMethodsList");

        // Falls vorher der "No additional payment methods"-Text angezeigt wurde, entfernen.
        container.find(".text-muted").remove();

        let index = $(".additional-payment-row").length;
        let methodId = "additionalPaymentMethodNew" + index;
        let detailsId = "additionalPaymentDetailsNew" + index;

        container.append(`
        <div class="row mb-3 g-2 additional-payment-row">
            <div class="col-md-5">
                <label for="${methodId}" class="form-label">Additional Payment Method</label>
                <select class="form-select additional-payment-method"
                        id="${methodId}"
                        data-payment-id="new"
                        data-original-method=""
                        required>
                    <option value="">-- Select --</option>
                    <option value="invoice">Invoice</option>
                    <option value="creditcard">Credit Card</option>
                </select>
            </div>

            <div class="col-md-5 additional-card-group" style="display:none;">
                <label for="${detailsId}" class="form-label">Credit Card Number</label>
                <input type="text"
                       class="form-control additional-payment-details"
                       id="${detailsId}"
                       placeholder="Enter card number">
            </div>

            <div class="col-auto d-flex align-items-end">
                <button type="button"
                        class="btn btn-outline-danger btn-sm btn-remove-unsaved-payment-method">
                    Remove
                </button>
            </div>
        </div>
    `);
    }

    // Entfernt eine neu hinzugefügte, aber noch nicht gespeicherte Zahlungsmethode wieder aus der Ansicht.
    $(document).on("click", ".btn-remove-unsaved-payment-method", function () {
        $(this).closest(".additional-payment-row").remove();

        if ($(".additional-payment-row").length === 0) {
            $("#additionalPaymentMethodsList").html(
                '<p class="text-muted small mb-0">No additional payment methods saved.</p>'
            );
        }
    });
});
