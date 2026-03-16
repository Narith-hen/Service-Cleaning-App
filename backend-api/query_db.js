const db = require('./src/config/db');
const fs = require('fs');

async function main() {
  const promiseDb = db.promise();
  try {
    const [columns] = await promiseDb.query("SHOW COLUMNS FROM messages");
    fs.writeFileSync('cols.json', JSON.stringify(columns, null, 2));

    const [messages] = await promiseDb.query("SELECT * FROM messages LIMIT 10");
    fs.writeFileSync('msgs.json', JSON.stringify(messages, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
