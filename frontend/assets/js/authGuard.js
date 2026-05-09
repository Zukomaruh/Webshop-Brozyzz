function requireLogin() {
    $.ajax({
        type: "POST",
        url: "../../backend/services/userServiceHandler.php",
        data: {method: "checkSession"},
        dataType: "json",
        success: function (response) {
            if(!response.loggedIn){
                //wird zu Login geleitet
                window.location.href="../pages/login.html";
            }
        },
        //Für den Fall eines Fehlers wird der User sicherheitshalber als ausgeloggt betrachtet
        error: function (response) {
            window.location.href="../pages/login.html";
        }
    });
}

function requireAdmin() {
    $.ajax({
        type: "POST",
        url: "../../backend/services/userServiceHandler.php",
        data: {method: "checkSession"},
        dataType: "json",
        success: function (response) {
            if(!response.loggedIn || response.role !== "admin"){
                //wird auf homepage geleitet
                window.location.href="../index.html";
            }
        },
        error: function (response) {
            window.location.href="../index.html";
        }
    });
}