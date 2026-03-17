const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    const [bookings] = await promiseDb.query("SELECT * FROM bookings LIMIT 10");
    console.log("Existing Bookings:", JSON.stringify(bookings, null, 2));

    const [users] = await promiseDb.query("SELECT * FROM users LIMIT 10");
    console.log("Existing Users:", JSON.stringify(users, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
