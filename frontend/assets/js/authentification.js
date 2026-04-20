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
});