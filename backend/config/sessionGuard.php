<?php
function requireLogin(){
    if (session_status() == PHP_SESSION_NONE) { session_start(); }
    if(!isset($_SESSION['user_id'])){
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Not logged in"]);
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if($_SESSION['role'] !== 'admin'){
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "No admin rights"]);
        exit;
    }
}
