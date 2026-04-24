$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: "../../backend/services/userServiceHandler.php",
        data: { method: "logoutUser" },
        dataType: "json",
        success: function (response) {
            if(response.success){
                window.location.href = "../index.html"
            }
        },
        error: function () {
            console.error("Logout fehlgeschlagen");
        }
    });
});