<?php
require_once "productLogic.php";

$method = $_POST["method"] ?? $_GET["method"] ?? "";
$data = array_merge($_GET, $_POST);

$logic = new ProductLogic();
$result = $logic->handleRequest($method, $data, $_FILES);

header('Content-Type: application/json');
echo json_encode($result);