const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    console.log("Creating views to bypass Prisma schema mismatches...");
    await promiseDb.query("CREATE OR REPLACE VIEW User AS SELECT * FROM users");
    await promiseDb.query("CREATE OR REPLACE VIEW Booking AS SELECT * FROM bookings");
    await promiseDb.query("CREATE OR REPLACE VIEW Service AS SELECT * FROM services");
    await promiseDb.query("CREATE OR REPLACE VIEW Role AS SELECT * FROM roles");
    console.log("Views created successfully.");
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.log("One of the base tables doesn't exist, ignoring:", err.message);
    } else {
      console.error(err);
    }
  } finally {
    process.exit(0);
  }
}

main();
