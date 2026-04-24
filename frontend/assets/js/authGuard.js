function requireLogin() {
    $.post("../../backend/services/userServiceHandler.php",
        { method: "checkSession"},
        function (response) {
            if(!response.loggedIn){
                window.location.href="../pages/login.html";
            }
        }, "json"
    );
}

function requireAdmin() {
    $.post("../../backend/services/userServiceHandler.php",
        { method: "checkSession"},
        function (response) {
            if(!response.loggedIn || response.role !== "admin"){
                window.location.href="../index.html";
            }
        }, "json"
    );
}