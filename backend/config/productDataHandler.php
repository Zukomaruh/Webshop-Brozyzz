<?php
require_once "dbaccess.php";

class ProductDataHandler {
    private $db;

    public function __construct() {
        $dbAccess = new DBAccess();
        $this->db = $dbAccess->getConnection();
    }

    public function getAllProducts() {
        $sql = "SELECT * FROM products";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        // Holt alle Zeilen als assoziatives Array
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createProduct($productData, $imageFile) {
        $name = trim($productData["name"] ?? "");
        $description = trim($productData["description"] ?? "");
        $price = trim($productData["price"] ?? "");
        $category = trim($productData["category"] ?? "");
        $rating = trim($productData["rating"] ?? "");

        if ($name === "" || $description === "" || $price === "" || $category === "" || $rating === "") {
            return ["success" => false, "message" => "Bitte alle Felder ausfüllen."];
        }

        if (!is_numeric($price) || (float)$price < 0) {
            return ["success" => false, "message" => "Ungültiger Preis."];
        }

        // Rating Vorrübergehend
        if (!is_numeric($rating) || (int)$rating < 1 || (int)$rating > 5) {
            return ["success" => false, "message" => "Bewertung muss zwischen 1 und 5 liegen."];
        }

        if (!$imageFile || !isset($imageFile["error"]) || $imageFile["error"] !== UPLOAD_ERR_OK) {
            return ["success" => false, "message" => "Bitte ein Bild hochladen."];
        }

        $allowedExtensions = ["jpg", "jpeg", "png", "webp"];
        $fileExtension = strtolower(pathinfo($imageFile["name"], PATHINFO_EXTENSION));

        if (!in_array($fileExtension, $allowedExtensions)) {
            return ["success" => false, "message" => "Nur JPG, JPEG, PNG oder WEBP erlaubt."];
        }

        $uploadDir = dirname(__DIR__) . "/productpictures/";

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $newFileName = uniqid("product_", true) . "." . $fileExtension;
        $targetPath = $uploadDir . $newFileName;

        if (!move_uploaded_file($imageFile["tmp_name"], $targetPath)) {
            return ["success" => false, "message" => "Bild konnte nicht gespeichert werden."];
        }

        try {
            $sql = "INSERT INTO products (name, description, price, category, rating, image)
                    VALUES (:name, :description, :price, :category, :rating, :image)";

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(":name", $name);
            $stmt->bindValue(":description", $description);
            $stmt->bindValue(":price", (float)$price);
            $stmt->bindValue(":category", $category);
            $stmt->bindValue(":rating", (int)$rating, PDO::PARAM_INT);
            $stmt->bindValue(":image", $newFileName);

            if ($stmt->execute()) {
                return ["success" => true, "message" => "Produkt erfolgreich angelegt."];
            }

            return ["success" => false, "message" => "Produkt konnte nicht gespeichert werden."];
        } catch (PDOException $e) {
            if (file_exists($targetPath)) {
                unlink($targetPath);
            }

            return ["success" => false, "message" => "DB-Fehler: " . $e->getMessage()];
        }
    }
}