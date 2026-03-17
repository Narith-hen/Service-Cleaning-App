const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    console.log("Renaming back to message_id...");
    await promiseDb.query("ALTER TABLE messages CHANGE id message_id INT AUTO_INCREMENT");
    console.log("Done.");
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

main();
