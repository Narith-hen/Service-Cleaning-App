const db = require('../../config/db');
const bcrypt = require('bcrypt');
const AppError = require('../../utils/error.util');

const normalizeStatus = (row) => {
  const statusText = String(row.status || '').trim().toLowerCase();
  if (!statusText) return 'Active';
  if (statusText === 'inactive') return 'Inactive';
  if (statusText === 'suspended') return 'Suspended';
  if (statusText === 'pending') return 'Pending';
  return statusText.charAt(0).toUpperCase() + statusText.slice(1);
};

const getCleanerProfileColumns = async (promiseDb) => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM cleaner_profile');
  return new Set((columns || []).map((column) => column.Field));
};

const getCleanerStatusEnumValues = async (promiseDb) => {
  const [rows] = await promiseDb.query(`SHOW COLUMNS FROM cleaner_profile LIKE 'status'`);
  const statusType = String(rows?.[0]?.Type || '');
  const enumMatches = statusType.match(/'([^']+)'/g) || [];
  return enumMatches.map((value) => value.replace(/'/g, ''));
};

const getCleanerRoleId = async (promiseDb) => {
  const [rows] = await promiseDb.query(
    `SELECT role_id FROM roles WHERE LOWER(role_name) = 'cleaner' LIMIT 1`
  );
  return Number(rows?.[0]?.role_id || 3);
};

const resolveServiceId = async (promiseDb, serviceType) => {
  if (serviceType) {
    const [serviceRows] = await promiseDb.query(
      'SELECT service_id FROM services WHERE name = ? LIMIT 1',
      [serviceType]
    );
    if (serviceRows?.[0]?.service_id) {
      return Number(serviceRows[0].service_id);
    }
  }

  const [fallbackRows] = await promiseDb.query(
    'SELECT service_id FROM services ORDER BY service_id ASC LIMIT 1'
  );
  if (!fallbackRows?.[0]?.service_id) {
    return null;
  }
  return Number(fallbackRows[0].service_id);
};

const generateCleanerCode = async (promiseDb) => {
  const [cleanerRows] = await promiseDb.query(`
    SELECT cleaner_code
    FROM cleaner_profile
    WHERE cleaner_code REGEXP '^CLN[0-9]+$'
    ORDER BY CAST(SUBSTRING(cleaner_code, 4) AS UNSIGNED) DESC
    LIMIT 1
  `);
  const cleanerLatestCode = cleanerRows?.[0]?.cleaner_code || null;
  const cleanerLatestNumber = cleanerLatestCode
    ? Number(String(cleanerLatestCode).replace(/^CLN/, ''))
    : 0;
  let nextNumber = (cleanerLatestNumber || 0) + 1;
  while (nextNumber < 1000000) {
    const candidate = `CLN${String(nextNumber).padStart(3, '0')}`;
    const [cleanerConflict] = await promiseDb.query(
      'SELECT cleaner_id FROM cleaner_profile WHERE cleaner_code = ? LIMIT 1',
      [candidate]
    );

    if (cleanerConflict.length === 0) {
      return candidate;
    }
    nextNumber += 1;
  }

  throw new AppError('Unable to generate cleaner code', 500);
};

const normalizeCleanerStatusInput = (status, allowedValues = []) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return null;

  const wanted = normalized === 'suspended'
    ? 'suspended'
    : normalized === 'inactive'
      ? 'inactive'
      : normalized === 'pending'
        ? 'pending'
        : 'active';

  const directMatch = allowedValues.find((value) => value.toLowerCase() === wanted);
  if (directMatch) return directMatch;

  // If pending is not supported in enum, fallback to inactive then active.
  if (wanted === 'pending') {
    const inactiveMatch = allowedValues.find((value) => value.toLowerCase() === 'inactive');
    if (inactiveMatch) return inactiveMatch;
  }

  const activeMatch = allowedValues.find((value) => value.toLowerCase() === 'active');
  return activeMatch || null;
};

const getCleanerIdByIdentifier = async (promiseDb, cleanerIdentifier) => {
  const parsedNumericId = Number.parseInt(cleanerIdentifier, 10);
  const hasNumericId = Number.isInteger(parsedNumericId) && String(parsedNumericId) === String(cleanerIdentifier).trim();
  const [rows] = await promiseDb.query(
    `
      SELECT cleaner_id
      FROM cleaner_profile
      WHERE cleaner_code = ?
         OR (${hasNumericId ? 'cleaner_id = ?' : '1 = 0'})
      LIMIT 1
    `,
    hasNumericId ? [cleanerIdentifier, parsedNumericId] : [cleanerIdentifier]
  );
  return Number(rows?.[0]?.cleaner_id || 0) || null;
};

const getCleanerRowById = async (promiseDb, cleanerId, cleanerProfileColumns) => {
  const hasAddress = cleanerProfileColumns.has('address');
  const hasLatitude = cleanerProfileColumns.has('latitude');
  const hasLongitude = cleanerProfileColumns.has('longitude');
  const hasProfileImage = cleanerProfileColumns.has('profile_image');
  const hasTotalReviews = cleanerProfileColumns.has('total_reviews');
  const hasRating = cleanerProfileColumns.has('rating');
  const hasAvgRating = cleanerProfileColumns.has('avg_rating');
  const profileRatingExpression = hasRating
    ? 'NULLIF(cp.rating, 0)'
    : hasAvgRating
      ? 'NULLIF(cp.avg_rating, 0)'
      : 'NULL';

  const [rows] = await promiseDb.query(
    `
      SELECT
        cp.cleaner_id,
        cp.cleaner_code,
        cp.company_email,
        cp.phone_number,
        cp.created_at,
        cp.role_id,
        cp.status,
        cp.company_name,
        cp.team_member,
        s.name AS service_type,
        ${hasAddress ? 'cp.address' : 'NULL'} AS address,
        ${hasLatitude ? 'cp.latitude' : 'NULL'} AS latitude,
        ${hasLongitude ? 'cp.longitude' : 'NULL'} AS longitude,
        ${hasProfileImage ? 'cp.profile_image' : 'NULL'} AS profile_image,
        COALESCE(bk.total_jobs, 0) AS total_jobs,
        COALESCE(rv.total_reviews, ${hasTotalReviews ? 'cp.total_reviews' : 'NULL'}, 0) AS total_reviews,
        COALESCE(rv.avg_rating, ${profileRatingExpression}, 3.00) AS avg_rating
      FROM cleaner_profile cp
      LEFT JOIN services s ON s.service_id = cp.service_id
      LEFT JOIN (
        SELECT cleaner_id, COUNT(*) AS total_jobs
        FROM bookings
        GROUP BY cleaner_id
      ) bk ON bk.cleaner_id = cp.cleaner_id
      LEFT JOIN (
        SELECT cleaner_id, COUNT(*) AS total_reviews, AVG(rating) AS avg_rating
        FROM reviews
        GROUP BY cleaner_id
      ) rv ON rv.cleaner_id = cp.cleaner_id
      WHERE cp.cleaner_id = ?
      LIMIT 1
    `,
    [cleanerId]
  );

  return rows?.[0] || null;
};

const getTableColumns = async (executor, tableName) => {
  try {
    const [columns] = await executor.query(`SHOW COLUMNS FROM \`${tableName}\``);
    return new Set((columns || []).map((column) => column.Field));
  } catch (_) {
    return null;
  }
};

const mapCleanerRow = (row) => {
  const status = normalizeStatus(row);
  const cleanerId = Number(row.cleaner_id);
  const name = String(row.company_name || row.company_email || `cleaner-${cleanerId}`);
  const createdDate = row.created_at ? new Date(row.created_at) : null;
  const totalReviews = Number(row.total_reviews || 0);
  const parsedRating = Number(row.avg_rating);
  const ratingValue = totalReviews > 0 && Number.isFinite(parsedRating) && parsedRating > 0
    ? parsedRating
    : 3;

  return {
    user_id: cleanerId,
    cleaner_id: cleanerId,
    cleanerCode: row.cleaner_code || null,
    cleaner_code: row.cleaner_code || null,
    id: row.cleaner_code || `CLN${String(cleanerId).padStart(3, '0')}`,
    name,
    email: row.company_email || null,
    companyName: row.company_name || name,
    companyEmail: row.company_email || null,
    phone: row.phone_number || null,
    teamMember: row.team_member || null,
    serviceType: row.service_type || null,
    address: row.address || null,
    latitude: row.latitude || null,
    longitude: row.longitude || null,
    profileImage: row.profile_image || null,
    status,
    totalJobs: Number(row.total_jobs || 0),
    reviews: totalReviews,
    rating: ratingValue,
    joiningDate: createdDate
      ? createdDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : null,
    created_at: row.created_at || null,
  };
};

const getAllCleaners = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const cleanerProfileColumns = await getCleanerProfileColumns(promiseDb);
    const hasAddress = cleanerProfileColumns.has('address');
    const hasLatitude = cleanerProfileColumns.has('latitude');
    const hasLongitude = cleanerProfileColumns.has('longitude');
    const hasProfileImage = cleanerProfileColumns.has('profile_image');
    const hasTotalReviews = cleanerProfileColumns.has('total_reviews');
    const hasRating = cleanerProfileColumns.has('rating');
    const hasAvgRating = cleanerProfileColumns.has('avg_rating');
    const profileRatingExpression = hasRating
      ? 'NULLIF(cp.rating, 0)'
      : hasAvgRating
        ? 'NULLIF(cp.avg_rating, 0)'
        : 'NULL';

    const cleanerRoleId = await getCleanerRoleId(promiseDb);
    const [rows] = await promiseDb.query(`
      SELECT
        cp.cleaner_id,
        cp.cleaner_code,
        cp.company_email,
        cp.phone_number,
        cp.created_at,
        cp.role_id,
        cp.status,
        cp.company_name,
        cp.team_member,
        s.name AS service_type,
        ${hasAddress ? 'cp.address' : 'NULL'} AS address,
        ${hasLatitude ? 'cp.latitude' : 'NULL'} AS latitude,
        ${hasLongitude ? 'cp.longitude' : 'NULL'} AS longitude,
        ${hasProfileImage ? 'cp.profile_image' : 'NULL'} AS profile_image,
        COALESCE(bk.total_jobs, 0) AS total_jobs,
        COALESCE(rv.total_reviews, ${hasTotalReviews ? 'cp.total_reviews' : 'NULL'}, 0) AS total_reviews,
        COALESCE(rv.avg_rating, ${profileRatingExpression}, 3.00) AS avg_rating
      FROM cleaner_profile cp
      INNER JOIN roles r ON r.role_id = cp.role_id AND LOWER(r.role_name) = 'cleaner'
      LEFT JOIN services s ON s.service_id = cp.service_id
      LEFT JOIN (
        SELECT cleaner_id, COUNT(*) AS total_jobs
        FROM bookings
        GROUP BY cleaner_id
      ) bk ON bk.cleaner_id = cp.cleaner_id
      LEFT JOIN (
        SELECT cleaner_id, COUNT(*) AS total_reviews, AVG(rating) AS avg_rating
        FROM reviews
        GROUP BY cleaner_id
      ) rv ON rv.cleaner_id = cp.cleaner_id
      WHERE cp.role_id = ?
      ORDER BY cp.cleaner_id DESC
    `, [cleanerRoleId]);

    res.status(200).json({
      success: true,
      data: rows.map(mapCleanerRow),
    });
  } catch (error) {
    next(error);
  }
};

const createCleaner = async (req, res, next) => {
  try {
    const {
      companyName,
      companyEmail,
      phoneNumber,
      teamMember,
      serviceType,
      address,
      latitude,
      longitude,
      password,
    } = req.body;
    const normalizedCompanyEmail = String(companyEmail || '').trim().toLowerCase();
    const uploadedProfileImage = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    if (!uploadedProfileImage) {
      return next(new AppError('Profile image is required', 400));
    }
    if (!normalizedCompanyEmail) {
      return next(new AppError('Company email is required', 400));
    }

    const promiseDb = db.promise();
    const cleanerProfileColumns = await getCleanerProfileColumns(promiseDb);

    const [existingRows] = await promiseDb.query(
      'SELECT cleaner_id FROM cleaner_profile WHERE company_email = ? LIMIT 1',
      [normalizedCompanyEmail]
    );

    if (existingRows?.length > 0) {
      return next(new AppError('Cleaner email already exists', 400));
    }

    const cleanerRoleId = await getCleanerRoleId(promiseDb);
    const serviceId = await resolveServiceId(promiseDb, serviceType);
    if (!serviceId) {
      return next(new AppError('No service available. Please create a service first.', 400));
    }
    const cleanerCode = await generateCleanerCode(promiseDb);
    const hashedPassword = await bcrypt.hash(password, 10);

    await promiseDb.query('START TRANSACTION');

    const cleanerColumns = [];
    const cleanerValues = [];
    const appendCleanerField = (column, value, required = false) => {
      if (cleanerProfileColumns.has(column)) {
        cleanerColumns.push(column);
        cleanerValues.push(value);
        return;
      }
      if (required) {
        throw new AppError(`Missing required cleaner_profile column: ${column}`, 500);
      }
    };

    appendCleanerField('service_id', serviceId, true);
    appendCleanerField('cleaner_code', cleanerCode, true);
    appendCleanerField('company_name', companyName, true);
    appendCleanerField('company_email', normalizedCompanyEmail, true);
    appendCleanerField('team_member', teamMember || null);
    appendCleanerField('phone_number', phoneNumber || null, true);
    appendCleanerField('profile_image', uploadedProfileImage);
    appendCleanerField('password', hashedPassword, true);
    appendCleanerField('status', 'active');
    appendCleanerField('role_id', cleanerRoleId, true);
    appendCleanerField('address', address || null);
    appendCleanerField('latitude', latitude || null);
    appendCleanerField('longitude', longitude || null);
    appendCleanerField('total_reviews', 0);
    if (cleanerProfileColumns.has('rating')) {
      appendCleanerField('rating', 3.00);
    } else if (cleanerProfileColumns.has('avg_rating')) {
      appendCleanerField('avg_rating', 3.00);
    }

    const cleanerPlaceholders = cleanerColumns.map(() => '?').join(', ');
    const [insertResult] = await promiseDb.query(
      `
        INSERT INTO cleaner_profile
          (${cleanerColumns.join(', ')})
        VALUES (${cleanerPlaceholders})
      `,
      cleanerValues
    );

    const cleanerId = Number(insertResult.insertId);

    await promiseDb.query('COMMIT');

    const [rows] = await promiseDb.query(
      `
        SELECT
          cp.cleaner_id,
          cp.cleaner_code,
          cp.company_email,
          cp.phone_number,
          cp.created_at,
          cp.status,
          cp.company_name,
          cp.team_member,
          s.name AS service_type,
          ${cleanerProfileColumns.has('address') ? 'cp.address' : 'NULL'} AS address,
          ${cleanerProfileColumns.has('latitude') ? 'cp.latitude' : 'NULL'} AS latitude,
          ${cleanerProfileColumns.has('longitude') ? 'cp.longitude' : 'NULL'} AS longitude,
          ${cleanerProfileColumns.has('profile_image') ? 'cp.profile_image' : 'NULL'} AS profile_image,
          0 AS total_jobs,
          COALESCE(${cleanerProfileColumns.has('total_reviews') ? 'cp.total_reviews' : 'NULL'}, 0) AS total_reviews,
          COALESCE(${cleanerProfileColumns.has('rating')
            ? 'NULLIF(cp.rating, 0)'
            : cleanerProfileColumns.has('avg_rating')
              ? 'NULLIF(cp.avg_rating, 0)'
              : 'NULL'}, 3.00) AS avg_rating
        FROM cleaner_profile cp
        LEFT JOIN services s ON s.service_id = cp.service_id
        WHERE cp.cleaner_id = ?
        LIMIT 1
      `,
      [cleanerId]
    );

    res.status(201).json({
      success: true,
      data: rows[0] ? mapCleanerRow(rows[0]) : null,
    });
  } catch (error) {
    try {
      await db.promise().query('ROLLBACK');
    } catch (_) {
      // Ignore rollback errors from non-transaction paths.
    }
    if (error?.code === 'ER_DUP_ENTRY') {
      const sqlMessage = String(error.sqlMessage || '');
      if (/for key 'email'/i.test(sqlMessage) || /for key 'company_email'/i.test(sqlMessage)) {
        return next(new AppError('Cleaner email already exists', 400));
      }
      if (/for key 'cleaner_code'/i.test(sqlMessage)) {
        return next(new AppError('Cleaner code already exists. Please try again.', 400));
      }
      return next(new AppError('Duplicate data detected while creating cleaner', 400));
    }
    next(error);
  }
};

const updateCleaner = async (req, res, next) => {
  try {
    const cleanerIdentifier = String(req.params.id || '').trim();
    if (!cleanerIdentifier) {
      return next(new AppError('Cleaner id is required', 400));
    }

    const {
      companyName,
      companyEmail,
      phoneNumber,
      teamMember,
      serviceType,
      address,
      latitude,
      longitude,
      status,
      password,
    } = req.body;

    const promiseDb = db.promise();
    const cleanerProfileColumns = await getCleanerProfileColumns(promiseDb);
    const cleanerId = await getCleanerIdByIdentifier(promiseDb, cleanerIdentifier);

    if (!cleanerId) {
      return next(new AppError('Cleaner not found', 404));
    }

    const updates = [];
    const values = [];
    const pushUpdate = (column, value) => {
      if (!cleanerProfileColumns.has(column)) return;
      updates.push(`${column} = ?`);
      values.push(value);
    };

    if (companyName !== undefined) {
      pushUpdate('company_name', String(companyName || '').trim());
    }

    if (companyEmail !== undefined) {
      const normalizedCompanyEmail = String(companyEmail || '').trim().toLowerCase();
      if (!normalizedCompanyEmail) {
        return next(new AppError('Company email is required', 400));
      }

      const [existingRows] = await promiseDb.query(
        `
          SELECT cleaner_id
          FROM cleaner_profile
          WHERE company_email = ?
            AND cleaner_id <> ?
          LIMIT 1
        `,
        [normalizedCompanyEmail, cleanerId]
      );
      if (existingRows?.length > 0) {
        return next(new AppError('Cleaner email already exists', 400));
      }
      pushUpdate('company_email', normalizedCompanyEmail);
    }

    if (phoneNumber !== undefined) {
      pushUpdate('phone_number', String(phoneNumber || '').trim());
    }
    if (teamMember !== undefined) {
      pushUpdate('team_member', String(teamMember || '').trim());
    }
    if (address !== undefined) {
      pushUpdate('address', String(address || '').trim());
    }
    if (latitude !== undefined) {
      pushUpdate('latitude', latitude === '' ? null : latitude);
    }
    if (longitude !== undefined) {
      pushUpdate('longitude', longitude === '' ? null : longitude);
    }

    if (serviceType !== undefined) {
      const serviceId = await resolveServiceId(promiseDb, String(serviceType || '').trim());
      if (!serviceId) {
        return next(new AppError('No service available. Please create a service first.', 400));
      }
      pushUpdate('service_id', serviceId);
    }

    if (status !== undefined && cleanerProfileColumns.has('status')) {
      const allowedStatuses = await getCleanerStatusEnumValues(promiseDb);
      const normalizedStatus = normalizeCleanerStatusInput(status, allowedStatuses);
      if (!normalizedStatus) {
        return next(new AppError('Invalid cleaner status', 400));
      }
      pushUpdate('status', normalizedStatus);
    }

    if (password !== undefined && String(password).trim() !== '') {
      const hashedPassword = await bcrypt.hash(String(password), 10);
      pushUpdate('password', hashedPassword);
    }

    if (req.file && cleanerProfileColumns.has('profile_image')) {
      pushUpdate('profile_image', `/uploads/avatars/${req.file.filename}`);
    }

    if (updates.length > 0) {
      values.push(cleanerId);
      await promiseDb.query(
        `UPDATE cleaner_profile SET ${updates.join(', ')} WHERE cleaner_id = ?`,
        values
      );
    }

    const cleanerRow = await getCleanerRowById(promiseDb, cleanerId, cleanerProfileColumns);
    res.status(200).json({
      success: true,
      data: cleanerRow ? mapCleanerRow(cleanerRow) : null,
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      const sqlMessage = String(error.sqlMessage || '');
      if (/for key 'company_email'/i.test(sqlMessage)) {
        return next(new AppError('Cleaner email already exists', 400));
      }
    }
    next(error);
  }
};

const deleteCleaner = async (req, res, next) => {
  const cleanerIdentifier = String(req.params.id || '').trim();
  if (!cleanerIdentifier) {
    return next(new AppError('Cleaner id is required', 400));
  }

  const pool = db.promise();
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const cleanerId = await getCleanerIdByIdentifier(connection, cleanerIdentifier);
    if (!cleanerId) {
      await connection.rollback();
      connection.release();
      return next(new AppError('Cleaner not found', 404));
    }

    // Remove references before deleting the cleaner account rows.
    // In this DB, reviews.cleaner_id is NOT NULL and FK-linked to users.user_id,
    // so reviews must be deleted rather than reassigned to NULL.
    await connection.query('DELETE FROM reviews WHERE cleaner_id = ?', [cleanerId]);
    await connection.query('UPDATE bookings SET cleaner_id = NULL WHERE cleaner_id = ?', [cleanerId]);
    await connection.query('DELETE FROM notifications WHERE user_id = ?', [cleanerId]).catch(() => {});
    await connection.query('DELETE FROM settings WHERE user_id = ?', [cleanerId]).catch(() => {});
    await connection.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [cleanerId, cleanerId]).catch(() => {});

    const [userDeleteResult] = await connection.query(
      'DELETE FROM users WHERE user_id = ?',
      [cleanerId]
    );

    const [profileDeleteResult] = await connection.query(
      'DELETE FROM cleaner_profile WHERE cleaner_id = ?',
      [cleanerId]
    );
    if (!profileDeleteResult?.affectedRows && !userDeleteResult?.affectedRows) {
      await connection.rollback();
      connection.release();
      return next(new AppError('Cleaner not found', 404));

    }

    await connection.commit();
    connection.release();

    res.status(200).json({
      success: true,
      message: 'Cleaner deleted successfully',
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {

      }
      connection.release();
    }
    next(error);
  }
};

module.exports = {
  getAllCleaners,
  createCleaner,
  updateCleaner,
  deleteCleaner,
};
