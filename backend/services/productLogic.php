<?php
require_once "../config/productDataHandler.php";

class ProductLogic {
    private $dh;

    public function __construct() {
        $this->dh = new ProductDataHandler();
    }

    public function handleRequest($method) {
        switch ($method) {
            case "getAllProducts":
                return $this->dh->getAllProducts();
            default:
                return null;
        }
    }
}