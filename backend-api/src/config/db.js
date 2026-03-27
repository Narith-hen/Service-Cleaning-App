const mysql = require('mysql2');
require('dotenv').config();

const parseDatabaseUrl = (rawUrl) => {
  if (!rawUrl) return {};

  try {
    const parsedUrl = new URL(rawUrl);
    return {
      host: parsedUrl.hostname || undefined,
      port: parsedUrl.port ? Number(parsedUrl.port) : undefined,
      user: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
      password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
      database: parsedUrl.pathname
        ? decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''))
        : undefined
    };
  } catch (error) {
    console.warn('Invalid DATABASE_URL format. Falling back to DB_* environment variables.');
    return {};
  }
};

const normalizeDbHost = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '127.0.0.1';
  return normalized.toLowerCase() === 'localhost' ? '127.0.0.1' : normalized;
};

const isLocalDbHost = (value) => ['127.0.0.1', '::1', 'localhost'].includes(
  String(value || '').trim().toLowerCase()
);

const getResolvedDbConfig = () => {
  const databaseUrlConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  const host = normalizeDbHost(process.env.DB_HOST || databaseUrlConfig.host);
  const port = Number(process.env.DB_PORT || databaseUrlConfig.port || 3306);
  const database = process.env.DB_NAME || databaseUrlConfig.database || 'cleaning_service_db';

  const explicitUser = process.env.DB_USER;
  const explicitPassword = process.env.DB_PASSWORD;
  const preferLocalRoot =
    process.env.PREFER_LOCAL_DB_ROOT !== 'false' &&
    process.env.NODE_ENV !== 'production' &&
    isLocalDbHost(host) &&
    explicitUser === undefined &&
    explicitPassword === undefined;

  const user = explicitUser || (preferLocalRoot ? 'root' : databaseUrlConfig.user) || 'root';
  const password =
    explicitPassword !== undefined
      ? explicitPassword
      : preferLocalRoot
        ? ''
        : databaseUrlConfig.password || '';

  const family = Number(process.env.DB_FAMILY || (host === '127.0.0.1' ? 4 : 0)) || undefined;

  return {
    host,
    port,
    user,
    password,
    database,
    family,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
};

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
