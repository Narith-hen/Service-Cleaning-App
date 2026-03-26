const bcrypt = require('bcrypt');
const db = require('../../config/db');
const AppError = require('../../utils/error.util');

const DEFAULT_SETTINGS = {
  language: 'en',
  notification_enabled: true,
  dark_mode: false
};

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const getSettingsColumns = async (promiseDb) => {
  const [rows] = await promiseDb.query('SHOW COLUMNS FROM settings');
  return new Set((rows || []).map((row) => String(row.Field || '').toLowerCase()));
};

const ensureSettingsSchema = async (promiseDb) => {
  const columns = await getSettingsColumns(promiseDb);

  if (!columns.has('user_id')) {
    await promiseDb.query('ALTER TABLE settings ADD COLUMN user_id INT NULL AFTER setting_id');
  }

  if (!columns.has('language')) {
    await promiseDb.query("ALTER TABLE settings ADD COLUMN language VARCHAR(10) NULL DEFAULT 'en' AFTER user_id");
  }

  if (!columns.has('notification_enabled')) {
    await promiseDb.query('ALTER TABLE settings ADD COLUMN notification_enabled TINYINT(1) NULL DEFAULT 1 AFTER language');
  }

  if (!columns.has('dark_mode')) {
    await promiseDb.query('ALTER TABLE settings ADD COLUMN dark_mode TINYINT(1) NULL DEFAULT 0 AFTER notification_enabled');
  }

  if (!columns.has('updated_at')) {
    await promiseDb.query('ALTER TABLE settings ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER dark_mode');
  }

  const refreshedColumns = await getSettingsColumns(promiseDb);

  if (refreshedColumns.has('user_id')) {
    const [indexRows] = await promiseDb.query('SHOW INDEX FROM settings WHERE Key_name = ?', ['uniq_settings_user_id']);
    if (!indexRows?.length) {
      await promiseDb.query('ALTER TABLE settings ADD UNIQUE KEY uniq_settings_user_id (user_id)');
    }
  }

  return refreshedColumns;
};

const getOrCreateSettings = async (promiseDb, userId) => {
  await ensureSettingsSchema(promiseDb);
  const [rows] = await promiseDb.query(
    `
      SELECT setting_id, user_id, language, notification_enabled, dark_mode, updated_at
      FROM settings
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  if (rows?.[0]) {
    return rows[0];
  }

  await promiseDb.query(
    `
      INSERT INTO settings (user_id, language, notification_enabled, dark_mode)
      VALUES (?, ?, ?, ?)
    `,
    [userId, DEFAULT_SETTINGS.language, DEFAULT_SETTINGS.notification_enabled, DEFAULT_SETTINGS.dark_mode]
  );

  const [createdRows] = await promiseDb.query(
    `
      SELECT setting_id, user_id, language, notification_enabled, dark_mode, updated_at
      FROM settings
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return createdRows?.[0] || null;
};

const mapSettingsRow = (row) => ({
  setting_id: Number(row?.setting_id || 0),
  user_id: Number(row?.user_id || 0),
  language: row?.language || DEFAULT_SETTINGS.language,
  notification_enabled: Boolean(row?.notification_enabled),
  dark_mode: Boolean(row?.dark_mode),
  updated_at: row?.updated_at || null
});

const getUserSettings = async (req, res, next) => {
  try {
    const userId = Number(req.user?.user_id || 0);
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const promiseDb = db.promise();
    const settings = await getOrCreateSettings(promiseDb, userId);

    res.status(200).json({
      success: true,
      data: mapSettingsRow(settings)
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const userId = Number(req.user?.user_id || 0);
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const promiseDb = db.promise();
    const columns = await ensureSettingsSchema(promiseDb);
    const currentSettings = await getOrCreateSettings(promiseDb, userId);
    const updates = [];
    const values = [];

    const requestedLanguage = req.body?.language;
    const nextLanguage = requestedLanguage === undefined
      ? currentSettings?.language || DEFAULT_SETTINGS.language
      : String(requestedLanguage || '').trim().toLowerCase();
    const allowedLanguages = new Set(['en', 'km']);

    if (requestedLanguage !== undefined) {
      if (!allowedLanguages.has(nextLanguage)) {
        return next(new AppError('Invalid language', 400));
      }
      if (columns.has('language')) {
        updates.push('language = ?');
        values.push(nextLanguage);
      }
    }

    if (req.body?.notification_enabled !== undefined && columns.has('notification_enabled')) {
      updates.push('notification_enabled = ?');
      values.push(normalizeBoolean(req.body.notification_enabled, Boolean(currentSettings?.notification_enabled)));
    }

    if (req.body?.dark_mode !== undefined && columns.has('dark_mode')) {
      updates.push('dark_mode = ?');
      values.push(normalizeBoolean(req.body.dark_mode, Boolean(currentSettings?.dark_mode)));
    }

    if (updates.length > 0) {
      values.push(userId);
      await promiseDb.query(
        `UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    const refreshedSettings = await getOrCreateSettings(promiseDb, userId);

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: mapSettingsRow(refreshedSettings)
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = Number(req.user?.user_id || 0);
    const accountSource = String(req.user?.account_source || 'users').trim().toLowerCase();
    const currentPassword = String(req.body?.current_password || req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.new_password || req.body?.newPassword || '').trim();

    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long', 400));
    }

    const promiseDb = db.promise();
    const sourceTable = accountSource === 'cleaner_profile' ? 'cleaner_profile' : 'users';
    const idColumn = sourceTable === 'cleaner_profile' ? 'cleaner_id' : 'user_id';
    const [rows] = await promiseDb.query(
      `SELECT password FROM ${sourceTable} WHERE ${idColumn} = ? LIMIT 1`,
      [userId]
    );

    const storedPassword = String(rows?.[0]?.password || '');
    if (!storedPassword) {
      return next(new AppError('Password is not available for this account', 400));
    }

    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
    const passwordMatches = isBcryptHash
      ? await bcrypt.compare(currentPassword, storedPassword)
      : currentPassword === storedPassword;

    if (!passwordMatches) {
      return next(new AppError('Current password is incorrect', 400));
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await promiseDb.query(
      `UPDATE ${sourceTable} SET password = ? WHERE ${idColumn} = ?`,
      [hashedPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserSettings,
  updateSettings,
  changePassword
};
