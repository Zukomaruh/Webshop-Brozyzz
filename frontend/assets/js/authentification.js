$(document).ready(function () {
    // Dynamische Anzeige der Kreditkarten-Felder bei der Registrierung
        $("#paymentMethod").change(function () {
            if ($(this).val() === "Kreditkarte") {
                $("#cardDetailsGroup").show().find('input').prop('required', true);
            } else {
                $("#cardDetailsGroup").hide().find('input').prop('required', false).val('');
            }
        });

    // REGISTRIERUNG
    $("#registerForm").submit(function (e) {
        e.preventDefault();

        let password = $("#registerPassword").val();
        let confirmPassword = $("#confirmPassword").val();

        if (password !== confirmPassword) {
            $("#registerMessage").text("Passwörter stimmen nicht übereinstimmen!").css("color", "red");
            return;
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: {
                method: "registerUser",
                gender: $("#gender").val(),
                firstName: $("#firstName").val(),
                lastName: $("#lastName").val(),
                username: $("#username").val(),
                email: $("#registerEmail").val(),
                address: $("#address").val(),
                zip: $("#zip").val(),
                city: $("#city").val(),
                paymentMethod: $("#paymentMethod").val(),
                paymentDetails: $("#paymentDetails").val(),
                password: password
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#registerMessage").text(response.message).css("color", "green");
                    $("#registerForm")[0].reset();
                    $("#cardDetailsGroup").hide();
                } else {
                    $("#registerMessage").text(response.message).css("color", "red");
                }
            },
            error: function () {
                $("#registerMessage").text("Server-Fehler aufgetreten.").css("color", "red");
            }
        });
    });

    // LOGIN (Nutzt jetzt den flexiblen Identifier für Email/Username)
    $("#loginForm").submit(function (e) {
        e.preventDefault();

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: {
                method: "loginUser",
                identifier: $("#loginIdentifier").val(), // Kann Email oder Username sein
                password: $("#loginPassword").val()
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#loginMessage").text(response.message).css("color", "green");
                    setTimeout(() => {
                        if (response.user.role === 'admin') {
                            window.location.href = "admin.html";
                        } else {
                            window.location.href = "../index.html";
                        }
                    }, 1000);
                } else {
                    $("#loginMessage").text(response.message).css("color", "red");
                }
            },
            error: function () {
                $("#loginMessage").text("Server-Fehler beim Login.").css("color", "red");
            }
        });
    });
});