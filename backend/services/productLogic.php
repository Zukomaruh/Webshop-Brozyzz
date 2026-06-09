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

            case "getProductById":
                return $this->dh->getProductById($data["product_id"] ?? null);

            case "createProduct":
                return $this->dh->createProduct($data, $files["image"] ?? null);

            case "getAllCategories":
                return $this->dh->getAllCategories();

            case "getProductsByCategory":
                return $this->dh->getProductsByCategory($data["category"] ?? "");

            case "searchProducts":
                return $this->dh->searchProducts($data["query"] ?? "");

            case "updateProduct":
                return $this->dh->updateProduct($data["product_id"], $data, $files["image"] ?? null);

            case "deleteProduct":
                return $this->dh->deleteProduct($data["product_id"] ?? null);

            default:
                return ["success" => false, "message" => "Method not allowed"];
        }
    }
}