const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const db = require('../src/config/db');
const { syncCleanerReviewStats } = require('../src/utils/cleanerReviewStats.util');

async function main() {
  const promiseDb = db.promise();

  try {
    const result = await syncCleanerReviewStats(promiseDb);
    const [rows] = await promiseDb.query(
      `
        SELECT cleaner_id, company_name, total_reviews
        FROM cleaner_profile
        ORDER BY cleaner_id ASC
      `
    );

    console.log('Cleaner review stats synchronized successfully.');
    console.table(
      (rows || []).map((row) => ({
        cleaner_id: row.cleaner_id,
        company_name: row.company_name,
        total_reviews: row.total_reviews
      }))
    );

    if (!result.updated) {
      console.log('No matching stats columns were found to update.');
    }
  } catch (error) {
    console.error('Failed to sync cleaner review stats:', error);
    process.exitCode = 1;
  } finally {
    db.end();
  }
}

main();
