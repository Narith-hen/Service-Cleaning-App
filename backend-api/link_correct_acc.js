const db = require('./src/config/db');

async function main() {
  const promiseDb = db.promise();
  try {
    const [users] = await promiseDb.query("SELECT * FROM users");
    const [accs] = await promiseDb.query("SELECT * FROM acc");
    
    // We already inserted a booking in the previous run. Let's find it.
    const [bookings] = await promiseDb.query("SELECT * FROM bookings ORDER BY booking_id DESC LIMIT 1");
    if (!bookings.length) return;
    const bId = bookings[0].booking_id;
    const u1 = users.find(u => u.role_id === 1) || users[0];
    const u2 = users.find(u => u.role_id === 2 || u.role_id === 3) || users[1];

    let acc1 = accs.find(a => a.user_id === u1.user_id);
    let acc2 = accs.find(a => a.user_id === u2.user_id);

    if (!acc1) {
      const [res1] = await promiseDb.query("INSERT INTO acc (user_id) VALUES (?)", [u1.user_id]);
      acc1 = { acc_id: res1.insertId };
    }
    if (!acc2) {
      const [res2] = await promiseDb.query("INSERT INTO acc (user_id) VALUES (?)", [u2.user_id]);
      acc2 = { acc_id: res2.insertId };
    }

    if (acc1 && acc2) {
      console.log(`Updating messages to booking_id: ${bId}, sender: ${acc1.acc_id}, receiver: ${acc2.acc_id}`);
      await promiseDb.query("UPDATE messages SET booking_id = ?, sender_id = ?, receiver_id = ? WHERE id = 1", [bId, acc1.acc_id, acc2.acc_id]);
      await promiseDb.query("UPDATE messages SET booking_id = ?, sender_id = ?, receiver_id = ? WHERE id = 2", [bId, acc2.acc_id, acc1.acc_id]);
      console.log("Messages correctly linked!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
