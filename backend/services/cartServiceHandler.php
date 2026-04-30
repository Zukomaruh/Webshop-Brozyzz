<?php
session_start();
require_once "cartLogic.php";

$method = $_POST["method"] ?? $_GET["method"] ?? "";
$logic = new CartLogic();
$result = $logic->handleRequest($method, $_POST ?: $_GET);

header('Content-Type: application/json');
echo json_encode($result);