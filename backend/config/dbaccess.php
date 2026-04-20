<?php
class DBAccess {
    private $host = "localhost";
    private $db_name = "brozyzzdb";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
        }
        return $this->conn;
    }
}