<?php
session_start(); //Für Login Status!
require_once "userLogic.php";

// Wir nehmen das ganze POST Array
$method = $_POST["method"] ?? "";
$userLogic = new UserLogic();
$result = $userLogic->handleRequest($method, $_POST);

header('Content-Type: application/json');
if ($result === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Bad Request"]);
} else {
    http_response_code(200);
    echo json_encode($result);
}