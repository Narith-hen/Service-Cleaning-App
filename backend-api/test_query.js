const db = require('./src/config/db');

async function main() {
  try {
    const [messages] = await db.promise().query(`
      SELECT m.*, 
        s_acc.user_id as sender_user_id,
        r_acc.user_id as receiver_user_id
      FROM messages m
      LEFT JOIN acc s_acc ON m.sender_id = s_acc.acc_id
      LEFT JOIN acc r_acc ON m.receiver_id = r_acc.acc_id
      WHERE m.booking_id = 1
    `);
    
    // Also let's check users table for these users
    if (messages.length > 0) {
       const uIds = [...new Set([messages[0].sender_user_id, messages[0].receiver_user_id])].filter(x => x);
       if (uIds.length > 0) {
           const [users] = await db.promise().query(`SELECT user_id, first_name, last_name, email FROM users WHERE user_id IN (?)`, [uIds]);
           console.log("Users:", users);
       }
    }
    
    console.log("Messages:", messages);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
