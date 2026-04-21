<?php
require_once "dbaccess.php";

class UserDataHandler {
    private $db;

    public function __construct() {
        $dbAccess = new DBAccess();
        $this->db = $dbAccess->getConnection();
    }

    public function registerUser($userData) {
        try {
            $sql = "INSERT INTO users (firstname, lastname, email, password, role)
                    VALUES (:fname, :lname, :email, :pass, :role)";

            $stmt = $this->db->prepare($sql);
            $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

            $stmt->bindValue(":fname", $userData['firstName']);
            $stmt->bindValue(":lname", $userData['lastName']);
            $stmt->bindValue(":email", $userData['email']);
            $stmt->bindValue(":pass", $hashedPassword);
            $stmt->bindValue(":role", 'user');

            if ($stmt->execute()) {
                return ["success" => true, "message" => "Registrierung erfolgreich!"];
            }
        } catch (PDOException $e) {
            return ["success" => false, "message" => "DB-Fehler: " . $e->getMessage()];
        }
        return ["success" => false, "message" => "Fehler beim Speichern."];
    }
}