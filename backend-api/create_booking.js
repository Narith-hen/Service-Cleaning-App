const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    console.log("Updating messages to booking_id: 1");
    // Since we renamed the column to 'id', we should use that
    await promiseDb.query("UPDATE messages SET booking_id = 1 WHERE id IN (1, 2)");
    console.log("Messages updated.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
