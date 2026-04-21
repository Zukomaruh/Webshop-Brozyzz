<?php
class User {
    public $id;
    public $firstName;
    public $lastName;
    public $email;
    public $password;

    public function __construct($id, $firstName, $lastName, $email, $password) {
        $this->id = $id;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->email = $email;
        $this->password = $password;
    }
}