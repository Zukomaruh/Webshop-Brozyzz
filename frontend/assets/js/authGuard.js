function requireLogin() {
    $.post("../../backend/services/userServiceHandler.php",
        { method: "checkSession"},
        function (response) {
            if(!response.loggedIn){
                //wird zu Login geleitet
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
                //wird auf homepage geleitet
                window.location.href="../index.html";
            }
        }, "json"
    );
}