$(document).ready(function () {

    // LOGIN
    $("#loginForm").submit(function (e) {
        e.preventDefault();

        let email = $("#loginEmail").val();
        let password = $("#loginPassword").val();
        let remember = $("#rememberMe").is(":checked");

        $.ajax({
            type: "POST",
            url: "../userServiceHandler.php",
            cache: false,
            data: {
                method: "loginUser",
                param: JSON.stringify({
                    email: email,
                    password: password,
                    remember: remember
                })
            },
            dataType: "json",
            success: function (response) {

                if (response.success) {
                    $("#loginMessage").text("Login successful");
                    window.location.href = "../index.html";
                } else {
                    $("#loginMessage").text(response.message);
                }
            }
        });
    });


    // REGISTER
    $("#registerForm").submit(function (e) {
        e.preventDefault();

        let firstName = $("#firstName").val();
        let lastName = $("#lastName").val();
        let email = $("#registerEmail").val();
        let password = $("#registerPassword").val();
        let confirmPassword = $("#confirmPassword").val();

        if (password !== confirmPassword) {
            $("#registerMessage").text("Passwords do not match");
            return;
        }

        $.ajax({
            type: "POST",
            url: "../userServiceHandler.php",
            cache: false,
            data: {
                method: "registerUser",
                param: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: password
                })
            },
            dataType: "json",
            success: function (response) {

                if (response.success) {
                    $("#registerMessage").text("Registration successful");
                } else {
                    $("#registerMessage").text(response.message);
                }
            }
        });
    });

});