# Brozyzz Webshop

Team 07: Julian Rainer, Matteo Samsinger, Konrad Grossinger


---

## Requirements

Before starting the project, make sure the following tools are installed:

- XAMPP
- Apache web server
- MariaDB/MySQL
- PHP 8.x
- phpMyAdmin
- A modern browser
- Git, if the project is cloned from a repository

Recommended local environment:

```text
PHP: 8.x
Database: MariaDB/MySQL
Server: Apache via XAMPP
```

---

## Installation

### 1. Clone or download the project

Clone the repository:

```bash
git clone <repository-url>
```

Or download the project as a ZIP file and extract it.

---

### 2. Move the project into the XAMPP folder

Move the complete project folder into the XAMPP `htdocs` directory.

Example on Windows:

```text
C:\xampp\htdocs\Webshop-Brozyzz
```

---

### 3. Start XAMPP

Open the XAMPP Control Panel and start:

```text
Apache
MySQL
```

Both services must be running before opening the project in the browser.

---

## Database Setup

The project uses a MariaDB/MySQL database.

### 1. Open phpMyAdmin

Open phpMyAdmin in your browser:

```text
http://localhost/phpmyadmin
```

---

### 2. Create the database

Create a new database with the following name:

```sql
brozyzzdb
```

Use the default collation or choose:

```text
utf8mb4_general_ci
```

---

### 3. Import the SQL dump

Import the provided SQL file into the `brozyzzdb` database.

Steps in phpMyAdmin:

1. Select the database `brozyzzdb`.
2. Click on **Import**.
3. Choose the provided SQL dump file.
4. Click **Import**.

The SQL dump creates the required tables and inserts sample data.

Included database tables:

```text
orders
order_items
payment_methods
products
remember_tokens
shopping_cart
users
vouchers
```

---

## Database Connection

After importing the database, check the database connection settings in the backend configuration file. (backend/config/dbaccess.php)

Use the following local default values when working with XAMPP:

```text
Host: localhost
Database: brozyzzdb
User: root
Password: 
```

The password is usually empty in a default XAMPP installation.

If your local MySQL setup uses another username or password, update the connection settings accordingly.

---

## Running the Project

After Apache and MySQL are running and the database has been imported, open the project in the browser.

Open the frontend entry page:

```text
http://localhost/frontend/index.html
```

---