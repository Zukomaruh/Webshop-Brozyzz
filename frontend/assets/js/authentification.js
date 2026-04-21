$(document).ready(function () {
    $("#registerForm").submit(function (e) {
        e.preventDefault();

        let firstName = $("#firstName").val();
        let lastName = $("#lastName").val();
        let email = $("#registerEmail").val();
        let password = $("#registerPassword").val();
        let confirmPassword = $("#confirmPassword").val();

        if (password !== confirmPassword) {
            $("#registerMessage").text("Passwords do not match").css("color", "red");
            return;
        }

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: {
                method: "registerUser",
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#registerMessage").text(response.message).css("color", "green");
                    $("#registerForm")[0].reset();
                } else {
                    $("#registerMessage").text(response.message).css("color", "red");
                }
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                $("#registerMessage").text("Server-Fehler aufgetreten.").css("color", "red");
            }
        });
    });

    // LOGIN
    $("#loginForm").submit(function (e) {
        e.preventDefault();

        let email = $("#loginEmail").val();
        let password = $("#loginPassword").val();

        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            cache: false,
            data: {
                method: "loginUser",
                email: email,
                password: password
            },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    $("#loginMessage").text(response.message).css("color", "green");
                    // Weiterleitung zum Index nach Erfolg
                    setTimeout(() => { window.location.href = "../index.html"; }, 1000);
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