<?php
require_once "../config/userDataHandler.php";

class UserLogic {
    private $userDataHandler;

    public function __construct() {
        $this->userDataHandler = new UserDataHandler();
    }

    public function handleRequest($method, $data) {
        switch ($method) {
            case "registerUser":
                return $this->userDataHandler->registerUser($data);
            case "loginUser":
                return $this->userDataHandler->loginUser($data);
            case "checkAdminAccess":
                return $this->userDataHandler->checkAdminSession();
            case "logoutUser":
                return $this->userDataHandler->logoutUser();
            default:
                return ["success" => false, "message" => "Methode nicht erlaubt"];
        }
    }
}