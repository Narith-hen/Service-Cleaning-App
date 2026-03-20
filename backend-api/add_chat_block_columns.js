const db = require('./src/config/db');

const mysql = require('mysql2/promise');

async function addChatBlockColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cleaning_service_db"
  });

  try {
    await connection.execute(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS customer_blocked TINYINT(1) DEFAULT 0;
    `);
    await connection.execute(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS cleaner_blocked TINYINT(1) DEFAULT 0;
    `);
    await connection.execute(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS blocked_at DATETIME NULL;
    `);
    console.log('✅ Chat block columns added successfully.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addChatBlockColumns();
