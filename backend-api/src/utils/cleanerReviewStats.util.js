const getCleanerProfileColumns = async (promiseDb) => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM cleaner_profile');
  return new Set((columns || []).map((column) => String(column.Field || '').toLowerCase()));
};

const resolveCleanerRatingColumn = (columnSet) => {
  if (columnSet.has('rating')) return 'rating';
  if (columnSet.has('avg_rating')) return 'avg_rating';
  return '';
};

const syncCleanerCompletedJobs = async (promiseDb, cleanerId = null) => {
  const cleanerProfileColumns = await getCleanerProfileColumns(promiseDb);
  if (!cleanerProfileColumns.has('total_jobs')) {
    return {
      cleanerProfileColumns,
      updated: false
    };
  }

  const params = [];
  const whereClause = cleanerId ? 'WHERE cp.cleaner_id = ?' : '';
  if (cleanerId) {
    params.push(cleanerId);
  }

  await promiseDb.query(
    `
      UPDATE cleaner_profile cp
      LEFT JOIN (
        SELECT cleaner_id, COUNT(*) AS total_jobs
        FROM bookings
        WHERE cleaner_id IS NOT NULL
          AND LOWER(COALESCE(booking_status, '')) = 'completed'
        GROUP BY cleaner_id
      ) bk ON bk.cleaner_id = cp.cleaner_id
      SET cp.\`total_jobs\` = COALESCE(bk.total_jobs, 0)
      ${whereClause}
    `,
    params
  );

  return {
    cleanerProfileColumns,
    updated: true
  };
};

const syncCleanerReviewStats = async (promiseDb, cleanerId = null) => {
  const cleanerProfileColumns = await getCleanerProfileColumns(promiseDb);
  const updates = [];

  if (cleanerProfileColumns.has('total_reviews')) {
    updates.push('cp.`total_reviews` = COALESCE(rv.total_reviews, 0)');
  }

  const ratingColumn = resolveCleanerRatingColumn(cleanerProfileColumns);
  if (ratingColumn) {
    updates.push(
      `cp.\`${ratingColumn}\` = CASE
        WHEN COALESCE(rv.total_reviews, 0) > 0 THEN ROUND(rv.avg_rating, 2)
        ELSE 3.00
      END`
    );
  }

  if (updates.length === 0) {
    return {
      cleanerProfileColumns,
      updated: false
    };
  }

  const params = [];
  const whereClause = cleanerId ? 'WHERE cp.cleaner_id = ?' : '';
  if (cleanerId) {
    params.push(cleanerId);
  }

  await promiseDb.query(
    `
      UPDATE cleaner_profile cp
      LEFT JOIN (
        SELECT cleaner_id, COUNT(*) AS total_reviews, AVG(rating) AS avg_rating
        FROM reviews
        WHERE cleaner_id IS NOT NULL
        GROUP BY cleaner_id
      ) rv ON rv.cleaner_id = cp.cleaner_id
      SET ${updates.join(', ')}
      ${whereClause}
    `,
    params
  );

  return {
    cleanerProfileColumns,
    updated: true
  };
};

module.exports = {
  getCleanerProfileColumns,
  resolveCleanerRatingColumn,
  syncCleanerCompletedJobs,
  syncCleanerReviewStats
};
