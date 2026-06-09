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

    public function getProductById($id) {
            $sql = "SELECT * FROM products WHERE product_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAllCategories() {
        $sql = "SELECT DISTINCT category
                FROM products
                WHERE category IS NOT NULL AND category != ''
                ORDER BY category ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getProductsByCategory($category) {
        $sql = "SELECT * FROM products WHERE category = :category";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category' => $category]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createProduct($productData, $imageFile) {
        $name = trim($productData["name"] ?? "");
        $description = trim($productData["description"] ?? "");
        $price = trim($productData["price"] ?? "");
        $category = trim($productData["category"] ?? "");
        $rating = trim($productData["rating"] ?? "");

        if ($name === "" || $description === "" || $price === "" || $category === "" || $rating === "") {
            return ["success" => false, "message" => "Please fill all fields."];
        }

        if (!is_numeric($price) || (float)$price < 0) {
            return ["success" => false, "message" => "Invalid price."];
        }

        // Rating Vorrübergehend
        if (!is_numeric($rating) || (int)$rating < 1 || (int)$rating > 5) {
            return ["success" => false, "message" => "Rating must be between 1 and 5."];
        }

        if (!$imageFile || !isset($imageFile["error"]) || $imageFile["error"] !== UPLOAD_ERR_OK) {
            return ["success" => false, "message" => "Please upload an image."];
        }

        $allowedExtensions = ["jpg", "jpeg", "png", "webp"];
        $fileExtension = strtolower(pathinfo($imageFile["name"], PATHINFO_EXTENSION));

        if (!in_array($fileExtension, $allowedExtensions)) {
            return ["success" => false, "message" => "only JPG, JPEG, PNG or WEBP allowed."];
        }

        $uploadDir = dirname(__DIR__) . "/productpictures/";

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $newFileName = uniqid("product_", true) . "." . $fileExtension;
        $targetPath = $uploadDir . $newFileName;

        if (!move_uploaded_file($imageFile["tmp_name"], $targetPath)) {
            return ["success" => false, "message" => "Image could not be saved."];
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
                return ["success" => true, "message" => "Product created successfully."];
            }

            return ["success" => false, "message" => "Product could not be saved."];
        } catch (PDOException $e) {
            if (file_exists($targetPath)) {
                unlink($targetPath);
            }

            return ["success" => false, "message" => "DB-Error: " . $e->getMessage()];
        }
    }

    public function updateProduct($id, $productData, $imageFile) {
        $name        = trim($productData["name"] ?? "");
        $description = trim($productData["description"] ?? "");
        $price       = trim($productData["price"] ?? "");
        $category    = trim($productData["category"] ?? "");
        $rating      = trim($productData["rating"] ?? "");

        if ($name === "" || $description === "" || $price === "" || $category === "" || $rating === "") {
            return ["success" => false, "message" => "Please fill all fields."];
        }

        if (!is_numeric($price) || (float)$price < 0) {
            return ["success" => false, "message" => "Invalid price."];
        }

        if (!is_numeric($rating) || (int)$rating < 1 || (int)$rating > 5) {
            return ["success" => false, "message" => "Rating must be between 1 and 5."];
        }

        try {
            // Neues Bild nur wenn hochgeladen
            $newFileName = null;
            if ($imageFile && isset($imageFile["error"]) && $imageFile["error"] === UPLOAD_ERR_OK) {
                $allowedExtensions = ["jpg", "jpeg", "png", "webp"];
                $fileExtension = strtolower(pathinfo($imageFile["name"], PATHINFO_EXTENSION));

                if (!in_array($fileExtension, $allowedExtensions)) {
                    return ["success" => false, "message" => "Only JPG, JPEG, PNG or WEBP allowed."];
                }

                $uploadDir = dirname(__DIR__) . "/productpictures/";
                $newFileName = uniqid("product_", true) . "." . $fileExtension;
                $targetPath = $uploadDir . $newFileName;

                if (!move_uploaded_file($imageFile["tmp_name"], $targetPath)) {
                    return ["success" => false, "message" => "Image could not be saved."];
                }
            }

            // SQL dynamisch – Bild nur updaten wenn neues hochgeladen
            $sql = "UPDATE products SET
                    name        = :name,
                    description = :description,
                    price       = :price,
                    category    = :category,
                    rating      = :rating
                    " . ($newFileName ? ", image = :image" : "") . "
                WHERE product_id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(":name",        $name);
            $stmt->bindValue(":description", $description);
            $stmt->bindValue(":price",       (float)$price);
            $stmt->bindValue(":category",    $category);
            $stmt->bindValue(":rating",      (int)$rating, PDO::PARAM_INT);
            $stmt->bindValue(":id",          (int)$id, PDO::PARAM_INT);

            if ($newFileName) {
                $stmt->bindValue(":image", $newFileName);
            }

            if ($stmt->execute()) {
                return ["success" => true, "message" => "Product updated successfully."];
            }

            return ["success" => false, "message" => "Product could not be updated."];

        } catch (PDOException $e) {
            return ["success" => false, "message" => "DB-Error: " . $e->getMessage()];
        }
    }

    public function deleteProduct($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM products WHERE product_id = :id");
            $stmt->execute([':id' => $id]);
            return ["success" => true, "message" => "Product deleted successfully."];
        } catch (PDOException $e) {
            return ["success" => false, "message" => "DB-Error: " . $e->getMessage()];
        }
    }

    public function searchProducts($query){
        $sql = "SELECT * FROM products WHERE name LIKE :query";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':query' => '%'.$query.'%']);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}