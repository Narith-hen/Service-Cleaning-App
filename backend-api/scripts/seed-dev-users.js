const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

const ensureRoleId = async (connection, roleName) => {
  const [rows] = await connection.query(
    'SELECT role_id FROM roles WHERE LOWER(role_name) = ? LIMIT 1',
    [String(roleName).toLowerCase()]
  );
  const existing = rows?.[0]?.role_id;
  if (existing) return Number(existing);

  const [insertResult] = await connection.query('INSERT INTO roles (role_name) VALUES (?)', [roleName]);
  return Number(insertResult.insertId);
};

const nextUserCode = async (connection, prefix) => {
  const cleanPrefix = String(prefix || '').toUpperCase();
  const [rows] = await connection.query(
    `
      SELECT COALESCE(MAX(CAST(SUBSTRING(user_code, ?) AS UNSIGNED)), 0) + 1 AS next_number
      FROM users
      WHERE user_code LIKE ?
    `,
    [cleanPrefix.length + 1, `${cleanPrefix}%`]
  );

  const nextNumber = Number(rows?.[0]?.next_number || 1);
  return `${cleanPrefix}${String(nextNumber).padStart(3, '0')}`;
};

const upsertUserByEmail = async (connection, user) => {
  const email = String(user.email).trim();
  const [existingRows] = await connection.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [email]);
  const existingId = existingRows?.[0]?.user_id ? Number(existingRows[0].user_id) : null;

  if (existingId) {
    await connection.query(
      `
        UPDATE users
        SET first_name = ?, last_name = ?, phone_number = ?, password = ?, role_id = ?
        WHERE user_id = ?
      `,
      [user.first_name, user.last_name, user.phone_number, user.password, user.role_id, existingId]
    );
    return existingId;
  }

  const userCode = await nextUserCode(connection, user.user_code_prefix);
  const [insertResult] = await connection.query(
    `
      INSERT INTO users (user_code, first_name, last_name, email, phone_number, password, role_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [userCode, user.first_name, user.last_name, email, user.phone_number, user.password, user.role_id]
  );
  return Number(insertResult.insertId);
};

const main = async () => {
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    console.error('Refusing to seed dev users when NODE_ENV=production.');
    process.exit(1);
  }

  const saltRounds = Number(getEnv('BCRYPT_SALT_ROUNDS', 12));
  const devPassword = String(getEnv('DEV_SEED_PASSWORD', 'password123'));
  const passwordHash = await bcrypt.hash(devPassword, saltRounds);

  const connection = await mysql.createConnection(connectionConfig);

  try {
    const adminRoleId = await ensureRoleId(connection, 'admin');
    const customerRoleId = await ensureRoleId(connection, 'customer');
    await ensureRoleId(connection, 'cleaner');

    const users = [
      {
        user_code_prefix: 'ADM',
        first_name: 'Alex',
        last_name: 'Admin',
        email: 'admin@example.com',
        phone_number: '+1 555-000-0001',
        password: passwordHash,
        role_id: adminRoleId,
      },
      {
        user_code_prefix: 'CUS',
        first_name: 'John',
        last_name: 'Customer',
        email: 'john@example.com',
        phone_number: '+1 555-000-0002',
        password: passwordHash,
        role_id: customerRoleId,
      },
    ];

    for (const user of users) {
      // eslint-disable-next-line no-await-in-loop
      const id = await upsertUserByEmail(connection, user);
      console.log(`Seeded/updated ${user.email} (user_id=${id})`);
    }

    console.log(`Done. Login password: ${devPassword}`);
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error('Seed failed:', error?.message || error);
  process.exit(1);
});
