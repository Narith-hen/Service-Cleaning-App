const db = require('./src/config/db');

async function fixDB() {
  const promiseDb = db.promise();
  try {
    console.log("Renaming message_id to id...");
    await promiseDb.query("ALTER TABLE messages CHANGE message_id id INT AUTO_INCREMENT;");
  } catch (err) {
    if (err.code !== 'ER_BAD_FIELD_ERROR') console.error(err.message);
  }

  try {
    console.log("Adding service_id...");
    await promiseDb.query("ALTER TABLE messages ADD COLUMN service_id INT NULL AFTER booking_id;");
  } catch (err) {
    console.error(err.message);
  }

  try {
    console.log("Adding service_package_id...");
    await promiseDb.query("ALTER TABLE messages ADD COLUMN service_package_id INT NULL AFTER service_id;");
  } catch (err) {
    console.error(err.message);
  }

  console.log("Done database fix.");
  process.exit(0);
}

fixDB();
