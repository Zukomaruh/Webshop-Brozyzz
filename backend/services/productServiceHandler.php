<?php
require_once "productLogic.php";

$method = $_POST["method"] ?? $_GET["method"] ?? "";

$logic = new ProductLogic();
$result = $logic->handleRequest($method, $_POST, $_FILES);

header('Content-Type: application/json');
echo json_encode($result);