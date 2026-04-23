<?php
require_once "productLogic.php";

$method = $_GET["method"] ?? "";
$logic = new ProductLogic();
$result = $logic->handleRequest($method);

header('Content-Type: application/json');
echo json_encode($result);