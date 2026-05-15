<?php
class User {
    public $id;
    public $firstName;
    public $lastName;
    public $gender;
    public $username;
    public $email;
    public $address;
    public $zip;
    public $city;
    public $paymentMethod;
    public $paymentDetails;
    public $role;

    public function __construct($id, $firstName, $lastName, $gender, $username, $email, $address, $zip, $city, $paymentMethod, $paymentDetails, $role) {
        $this->id = $id;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->gender = $gender;
        $this->username = $username;
        $this->email = $email;
        $this->address = $address;
        $this->zip = $zip;
        $this->city = $city;
        $this->paymentMethod = $paymentMethod;
        $this->paymentDetails = $paymentDetails;
        $this->role = $role;
    }
}