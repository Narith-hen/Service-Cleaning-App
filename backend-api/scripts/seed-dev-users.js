const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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

const tableExists = async (connection, tableName) => {
  const [rows] = await connection.query('SHOW TABLES LIKE ?', [tableName]);
  return Array.isArray(rows) && rows.length > 0;
};

const getTableColumns = async (connection, tableName) => {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return Array.isArray(rows) ? rows : [];
};

const isRequiredColumn = (column) => {
  if (!column) return false;
  const isAutoIncrement = /auto_increment/i.test(String(column.Extra || ''));
  return String(column.Null || '').toUpperCase() === 'NO' && column.Default == null && !isAutoIncrement;
};

const getFirstServiceId = async (connection) => {
  try {
    if (!(await tableExists(connection, 'services'))) return null;
    const serviceColumns = await getTableColumns(connection, 'services');
    const hasServiceId = serviceColumns.some((col) => col.Field === 'service_id');
    if (!hasServiceId) return null;
    const [rows] = await connection.query('SELECT service_id FROM services ORDER BY service_id ASC LIMIT 1');
    const id = rows?.[0]?.service_id;
    return id ? Number(id) : null;
  } catch {
    return null;
  }
};

const generateCleanerCode = async (connection) => {
  const [rows] = await connection.query(`
    SELECT cleaner_code
    FROM cleaner_profile
    WHERE cleaner_code REGEXP '^CLN[0-9]+$'
    ORDER BY CAST(SUBSTRING(cleaner_code, 4) AS UNSIGNED) DESC
    LIMIT 1
  `);

  const latest = rows?.[0]?.cleaner_code ? String(rows[0].cleaner_code) : null;
  const latestNumber = latest ? Number(latest.replace(/^CLN/i, '')) : 0;
  let nextNumber = (latestNumber || 0) + 1;

  while (nextNumber < 1000000) {
    const candidate = `CLN${String(nextNumber).padStart(3, '0')}`;
    // eslint-disable-next-line no-await-in-loop
    const [conflicts] = await connection.query(
      'SELECT cleaner_id FROM cleaner_profile WHERE cleaner_code = ? LIMIT 1',
      [candidate]
    );
    if (!conflicts || conflicts.length === 0) return candidate;
    nextNumber += 1;
  }

  return `CLN${Date.now()}`;
};

const maybeSeedDevCleaner = async (connection, { cleanerRoleId, passwordHash }) => {
  if (!(await tableExists(connection, 'cleaner_profile'))) {
    console.log('Skipping cleaner seed: cleaner_profile table not found.');
    return;
  }

  const devCleanerEmail = 'maria@example.com';
  const normalizedEmail = devCleanerEmail.toLowerCase();
  const columns = await getTableColumns(connection, 'cleaner_profile');
  const columnMap = new Map(columns.map((col) => [col.Field, col]));

  const requiredColumns = columns.filter(isRequiredColumn).map((col) => col.Field);
  const supportedValues = new Map();

  supportedValues.set('company_email', normalizedEmail);
  supportedValues.set('company_name', 'Maria Cleaning Co.');
  supportedValues.set('phone_number', '+1 555-000-0003');
  supportedValues.set('password', passwordHash);
  supportedValues.set('role_id', cleanerRoleId);
  supportedValues.set('profile_image', '/uploads/avatars/dev-cleaner.png');
  supportedValues.set('status', 'active');
  supportedValues.set('team_member', 'Maria Garcia');
  supportedValues.set('total_jobs', 0);
  supportedValues.set('total_reviews', 0);
  supportedValues.set('rating', 3.0);
  supportedValues.set('avg_rating', 3.0);
  supportedValues.set('created_at', new Date());
  supportedValues.set('updated_at', new Date());

  if (columnMap.has('service_id')) {
    const serviceId = await getFirstServiceId(connection);
    if (serviceId != null) supportedValues.set('service_id', serviceId);
  }

  if (columnMap.has('cleaner_code')) {
    supportedValues.set('cleaner_code', await generateCleanerCode(connection));
  }

  const missingRequired = requiredColumns.filter((field) => !supportedValues.has(field));
  if (missingRequired.length > 0) {
    console.log(
      `Skipping cleaner seed: cleaner_profile has required columns we don't know how to populate: ${missingRequired.join(', ')}`
    );
    return;
  }

  const [existingRows] = await connection.query(
    'SELECT cleaner_id FROM cleaner_profile WHERE LOWER(company_email) = ? LIMIT 1',
    [normalizedEmail]
  );
  const existingId = existingRows?.[0]?.cleaner_id ? Number(existingRows[0].cleaner_id) : null;

  if (existingId) {
    const updates = [];
    const values = [];
    for (const [field, value] of supportedValues.entries()) {
      if (!columnMap.has(field)) continue;
      updates.push(`\`${field}\` = ?`);
      values.push(value);
    }
    if (updates.length > 0) {
      values.push(existingId);
      await connection.query(
        `UPDATE cleaner_profile SET ${updates.join(', ')} WHERE cleaner_id = ?`,
        values
      );
    }
    console.log(`Seeded/updated ${devCleanerEmail} in cleaner_profile (cleaner_id=${existingId})`);
    return;
  }

  const insertColumns = [];
  const insertValues = [];
  for (const [field, value] of supportedValues.entries()) {
    if (!columnMap.has(field)) continue;
    insertColumns.push(`\`${field}\``);
    insertValues.push(value);
  }
  const placeholders = insertColumns.map(() => '?').join(', ');
  const [result] = await connection.query(
    `INSERT INTO cleaner_profile (${insertColumns.join(', ')}) VALUES (${placeholders})`,
    insertValues
  );
  const cleanerId = Number(result.insertId);
  console.log(`Seeded ${devCleanerEmail} in cleaner_profile (cleaner_id=${cleanerId})`);
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
    const cleanerRoleId = await ensureRoleId(connection, 'cleaner');

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

    await maybeSeedDevCleaner(connection, { cleanerRoleId, passwordHash });
    console.log(`Done. Login password: ${devPassword}`);
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error('Seed failed:', error?.message || error);
  process.exit(1);
});
