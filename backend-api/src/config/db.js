const mysql = require('mysql2');
const { getResolvedDbConfig } = require('./db-options');

const { family: preferredFamily, ...poolConfig } = getResolvedDbConfig();

const db = mysql.createPool(poolConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error(
      `Database pool connection failed (${poolConfig.host}:${poolConfig.port}/${poolConfig.database} as ${poolConfig.user}${preferredFamily ? `, IPv${preferredFamily}` : ''}):`,
      err
    );
    return;
  }

  console.log(
    `MySQL pool connected (${poolConfig.host}:${poolConfig.port}/${poolConfig.database}${preferredFamily ? `, IPv${preferredFamily}` : ''})`
  );
  connection.release();
});

module.exports = db;
