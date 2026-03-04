const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",          // your mysql username
  password: "",      // your mysql password
  database: "cleaning_service_db"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("MySQL Connected ✅");
});

module.exports = db;