const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",          // your mysql username
  password: process.env.DB_PASSWORD || "",      // your mysql password
  database: process.env.DB_NAME || "cleaning_service_db"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("MySQL Connected ✅");
});

module.exports = db;