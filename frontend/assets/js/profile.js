$(document).ready(function () {
    let currentProfileData = null;

    loadUserProfile();

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
        switchToViewMode();
        fillFormFields(currentProfileData);
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
});