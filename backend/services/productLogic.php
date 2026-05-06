<?php
require_once "../config/productDataHandler.php";

class ProductLogic {
    private $dh;

    public function __construct() {
        $this->dh = new ProductDataHandler();
    }

    public function handleRequest($method, $data = [], $files = []) {
        switch ($method) {
            case "getAllProducts":
                return $this->dh->getAllProducts();

            case "createProduct":
                return $this->dh->createProduct($data, $files["image"] ?? null);

            case "getAllCategories":
                        return $this->dh->getAllCategories();

            case "getProductsByCategory":
                        return $this->dh->getProductsByCategory($data["category"] ?? "");

            default:
                return ["success" => false, "message" => "Methode nicht erlaubt"];
        }
    }
}