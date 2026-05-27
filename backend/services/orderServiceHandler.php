<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once "orderLogic.php";

$method = $_POST["method"] ?? $_GET["method"] ?? "";
$logic = new OrderLogic();
$result = $logic->handleRequest($method, $_POST ?: $_GET);

header('Content-Type: application/json');
echo json_encode($result);
