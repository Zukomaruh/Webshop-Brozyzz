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
            case "checkSession":
                return $this->userDataHandler->checkSession();
            case "getUserProfile":
                return $this->userDataHandler->getUserProfile();
            case "updateUserProfile":
                return $this->userDataHandler->updateUserProfile($data);
            case "getAllCustomers":
                return $this->userDataHandler->getAllCustomers();
            case "toggleCustomerStatus":
                 return $this->userDataHandler->toggleCustomerStatus($data);
            case "getUserDetailsForAdmin":
                 return $this->userDataHandler->getUserDetailsForAdmin($data);
            case "getPaymentMethods":
                return $this->userDataHandler->getPaymentMethods();
            case "addPaymentMethod":
                return $this->userDataHandler->addPaymentMethod($data);
            case "deletePaymentMethod":
                return $this->userDataHandler->deletePaymentMethod($data);
            default:
                return ["success" => false, "message" => "Method not allowed"];
        }
    }
}
