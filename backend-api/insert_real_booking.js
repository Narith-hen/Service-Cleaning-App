const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    const [users] = await promiseDb.query("SELECT * FROM users");
    const [services] = await promiseDb.query("SELECT * FROM services LIMIT 1");

    if (users.length >= 2) {
      const u1 = users.find(u => u.role_id === 1) || users[0];
      const u2 = users.find(u => u.role_id === 2 || u.role_id === 3) || users[1];
      
      let s1Id = 1;
      if (services.length > 0) {
        s1Id = services[0].service_id;
      } else {
        await promiseDb.query("INSERT INTO services (name, price, description) VALUES ('Basic Clean', 50, 'Basic')");
        const [newS] = await promiseDb.query("SELECT * FROM services LIMIT 1");
        s1Id = newS[0].service_id;
      }

      // Insert an actual valid booking
      const [res] = await promiseDb.query(
        "INSERT INTO bookings (booking_date, booking_status, total_price, payment_status, user_id, cleaner_id, service_id) VALUES (NOW(), 'Pending', 100, 'Unpaid', ?, ?, ?)",
        [u1.user_id, u2.user_id, s1Id]
      );
      const bId = res.insertId;
      console.log("Successfully created real booking with ID:", bId);

      // Now update the old unassigned messages to belong to this booking
      // And also update their sender and receiver IDs to match the users
      await promiseDb.query("UPDATE messages SET booking_id = ?, sender_id = ?, receiver_id = ? WHERE id = 1", [bId, u1.user_id, u2.user_id]);
      await promiseDb.query("UPDATE messages SET booking_id = ?, sender_id = ?, receiver_id = ? WHERE id = 2", [bId, u2.user_id, u1.user_id]);
      
      console.log("Messages have been linked to the real booking and users!");
    } else {
      console.log("Not enough users to create a valid booking. Will insert dummy service.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
