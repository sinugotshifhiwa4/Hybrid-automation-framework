## 🔐 SQL Server Authentication: Mixed Mode Setup & Admin User Creation

To run automated tests using SQL Authentication (e.g., for Playwright or API database validations), ensure SQL Server is using **Mixed Mode Authentication** (SQL + Windows authentication).

---

### ✅ Step 0: Check If SQL Server Is Using Mixed Mode Authentication

Run the following query to verify the authentication mode:

```sql
SELECT 
  SERVERPROPERTY('IsIntegratedSecurityOnly') AS IsWindowsAuthOnly;
```

* **Result = 1** → Windows Authentication only.
* **Result = 0** → Mixed Mode Authentication is enabled (✅ required).

> If the result is `1`, you'll need to change the authentication mode to **Mixed Mode** in SQL Server Management Studio and **restart the SQL Server service**.

---

### 🧩 Step 1: Create the `admin` SQL Login

Run the following commands to create the login, database user, and assign permissions:

```sql
-- Create the SQL Server login
CREATE LOGIN admin WITH PASSWORD = 'password123';

-- Switch to your target database
USE tshifhiwaDemo;

-- Create a corresponding user in the database
CREATE USER admin FOR LOGIN admin;

-- Grant permissions (choose one option below):

-- Option A: Read/Write Access
ALTER ROLE db_datareader ADD MEMBER admin;
ALTER ROLE db_datawriter ADD MEMBER admin;

-- Option B: Full DB Access (Use with caution)
-- ALTER ROLE db_owner ADD MEMBER admin;
```

---

### 🔎 Step 2: Verify the Login and User

```sql
-- Check if the login exists at the server level
SELECT name, type_desc, is_disabled 
FROM sys.server_principals 
WHERE name = 'admin';

-- Check if the user exists in the target database
USE tshifhiwaDemo;
SELECT name, type_desc 
FROM sys.database_principals 
WHERE name = 'admin';
```

---

### 📌 Notes

* Use strong passwords in real environments.
* Mixed Mode is required for SQL Authentication via test automation tools.
* Always grant only the minimum required privileges (`reader`, `writer`, or `owner`).
* Restart the SQL Server service if you change authentication mode.

---
