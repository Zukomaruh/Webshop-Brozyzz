$(document).ready(function () {

    // Prüffunktion beim Laden der Seite
    checkAccess();

    function checkAccess() {
        $.ajax({
            type: "POST",
            url: "../../backend/services/userServiceHandler.php",
            data: {
                method: "checkAdminAccess"
            },
            dataType: "json",
            success: function (response) {
                if (response && response.isAdmin) {
                    // Wenn der Server sagt "Admin", zeigen wir die Seite
                    $("body").show();
                } else {
                    // Ansonsten: Zurück zum Login
                    window.location.href = "login.html";
                }
            },
            error: function () {
                // Bei einem Serverfehler (z.B. Session abgelaufen) ebenfalls Redirect
                window.location.href = "login.html";
            }
        });
    }

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
                $("#productMessage").text("Server-Fehler beim Speichern.").css("color", "red");
            }
        });
    });

});