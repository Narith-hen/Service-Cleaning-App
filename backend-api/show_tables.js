const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    const [tables] = await promiseDb.query("SHOW TABLES");
    console.log("Tables:", JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
