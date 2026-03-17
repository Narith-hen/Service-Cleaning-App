const mysql = require('mysql2/promise');
require('dotenv').config();

const getEnv = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === null || String(value).trim() === '' ? fallback : value;
};

const connectionConfig = {
  host: getEnv('DB_HOST', 'localhost'),
  user: getEnv('DB_USER', 'root'),
  password: getEnv('DB_PASSWORD', ''),
  database: getEnv('DB_NAME', 'cleaning_service_db'),
};

const getUniqueIndexesForColumns = async (connection, tableName, columnNames) => {
  const wanted = new Set((columnNames || []).map((name) => String(name).toLowerCase()));
  const [rows] = await connection.query(`SHOW INDEX FROM \`${tableName}\` WHERE Non_unique = 0`);

  const indexes = new Map(); // key_name -> Set(column_name)
  for (const row of rows || []) {
    const keyName = String(row?.Key_name || '');
    const colName = String(row?.Column_name || '').toLowerCase();
    if (!keyName || !wanted.has(colName)) continue;

    const cols = indexes.get(keyName) || new Set();
    cols.add(colName);
    indexes.set(keyName, cols);
  }

  return indexes;
};

const dropIndexIfExists = async (connection, tableName, indexName) => {
  try {
    await connection.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
    return true;
  } catch (error) {
    const code = String(error?.code || '');
    if (code === 'ER_CANT_DROP_FIELD_OR_KEY') return false;
    throw error;
  }
};

const main = async () => {
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    console.error('Refusing to change schema when NODE_ENV=production.');
    process.exit(1);
  }

  const connection = await mysql.createConnection(connectionConfig);
  try {
    const tableName = 'users';

    const indexes = await getUniqueIndexesForColumns(connection, tableName, ['first_name', 'last_name']);

    const targets = [];
    for (const [keyName, cols] of indexes.entries()) {
      // Only drop indexes that are exactly the incorrect single-column uniques.
      if (cols.size === 1 && (cols.has('first_name') || cols.has('last_name'))) {
        targets.push(keyName);
      }
    }

    if (!targets.length) {
      console.log('No incorrect UNIQUE indexes found on users.first_name / users.last_name.');
      return;
    }

    for (const indexName of targets) {
      // eslint-disable-next-line no-await-in-loop
      const dropped = await dropIndexIfExists(connection, tableName, indexName);
      console.log(`${dropped ? 'Dropped' : 'Skipped'} index: ${indexName}`);
    }

    console.log('Done.');
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error('Fix failed:', error?.message || error);
  process.exit(1);
});

