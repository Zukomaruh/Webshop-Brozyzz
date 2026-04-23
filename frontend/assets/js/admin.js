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
});