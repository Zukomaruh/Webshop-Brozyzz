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

    public function loginUser($data) {
        $sql = "SELECT * FROM users WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Falls User existiert, passwort prüfen
        if ($user && password_verify($data['password'], $user['password'])) {
            // Session starten und User-Daten merken
            if (session_status() == PHP_SESSION_NONE) { session_start(); }
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['firstname'] = $user['firstname'];

            return [
                "success" => true,
                "message" => "Willkommen zurück, " . $user['firstname'] . "!",
                "user" => ["id" => $user['user_id'], "role" => $user['role']]
            ];
        }

        return ["success" => false, "message" => "E-Mail oder Passwort falsch."];
    }
}