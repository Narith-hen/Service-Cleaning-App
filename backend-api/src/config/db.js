const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cleaning_service_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Database pool connection failed:', err);
    return;
  }

  console.log('MySQL pool connected');
  connection.release();
});

module.exports = db;
