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
}