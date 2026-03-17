const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    const [bookings] = await promiseDb.query("SELECT * FROM booking LIMIT 5");
    console.log("Bookings:", bookings);

    if (bookings.length > 0) {
      const bId = bookings[0].booking_id;
      console.log("Updating messages to booking_id:", bId);
      await promiseDb.query("UPDATE messages SET booking_id = ? WHERE booking_id IS NULL", [bId]);
      
      const [messages] = await promiseDb.query("SELECT * FROM messages");
      console.log("Updated Messages:", messages);
    } else {
      console.log("No bookings found in the database. I cannot link messages.");
    }
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      try {
        const [bookings2] = await promiseDb.query("SELECT * FROM bookings LIMIT 5");
        console.log("Bookings (plural):", bookings2);
        
        if (bookings2.length > 0) {
          const bId = bookings2[0].booking_id;
          console.log("Updating messages to booking_id:", bId);
          await promiseDb.query("UPDATE messages SET booking_id = ? WHERE booking_id IS NULL", [bId]);
          
          const [messages] = await promiseDb.query("SELECT * FROM messages");
          console.log("Updated Messages:", messages);
        }
      } catch (err2) {
        console.error("Failed to query bookings plural:", err2.message);
      }
    } else {
      console.error(err);
    }
  } finally {
    process.exit(0);
  }
}

main();
