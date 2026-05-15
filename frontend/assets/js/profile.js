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

    // Felder befüllen und sensible Daten maskieren
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

        // NEU: Kreditkartennummer für die reine Ansicht zensieren
        if (user.payment_method === "Kreditkarte" && user.payment_details) {
            let maskedCard = maskCreditCard(user.payment_details);
            $("#paymentDetails").val(maskedCard);
        } else {
            $("#paymentDetails").val(user.payment_details);
        }

        toggleCreditCardDisplay(user.payment_method);
    }

    // Hilfsfunktion: Macht aus "1234567812345678" -> "************5678"
    function maskCreditCard(cardNumber) {
        let cleaned = cardNumber.replace(/\s+/g, ''); // Leerzeichen weg
        if (cleaned.length < 4) return "****";
        let lastFour = cleaned.slice(-4);
        return "*".repeat(cleaned.length - 4) + lastFour;
    }

    // "Edit Profile" geklickt
    $("#btnToggleEdit").click(function () {
        $("#profileForm").find('input, select').prop('disabled', false);

        // NEU: Im Edit-Modus leeren wir das Kreditkartenfeld.
        // Wenn der User es leer lässt, behalten wir im Backend die alte Karte bei.
        if ($("#paymentMethod").val() === "Kreditkarte") {
            $("#paymentDetails").val('').attr("placeholder", "Enter new card number or leave empty to keep current");
            $("#paymentDetails").prop('required', false); // Nicht zwingend required, da leer = behalten
        }

        $("#actionButtons").attr("style", "display: flex !important;");
        $("#passwordConfirmGroup").attr("style", "display: block !important;");
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
        // Falls im Edit-Modus auf Kreditkarte gewechselt wird, Placeholder setzen
        if ($(this).val() === "Kreditkarte" && !$(this).is(':disabled')) {
            $("#paymentDetails").attr("placeholder", "Enter card number").prop('required', true);
        }
    });

    function toggleCreditCardDisplay(method) {
        if (method === "Kreditkarte") {
            $("#cardGroup").show();
        } else {
            $("#cardGroup").hide().find('input').prop('required', false).val('');
        }
    }

    function switchToViewMode() {
        $("#profileForm").find('input, select').prop('disabled', true);
        $("#paymentDetails").attr("placeholder", ""); // Placeholder entfernen
        $("#actionButtons").attr("style", "display: none !important;");
        $("#passwordConfirmGroup").attr("style", "display: none !important;");
        $("#passwordConfirm").prop('required', false).val('');
        $("#btnToggleEdit").removeClass("d-none");
    }

    $("#profileForm").submit(function (e) {
        e.preventDefault();

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
                paymentDetails: $("#paymentDetails").val(), // Schickt entweder neue Nummer oder Leerstring
                passwordConfirm: $("#passwordConfirm").val()
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
                console.error("Server-Fehler:", xhr.responseText);
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