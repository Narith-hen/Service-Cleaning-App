const db = require('./src/config/db');

async function migrateDatabase() {
  try {
    const promiseDb = db.promise();
    console.log('Starting chat database migration...');

    // 1. Create `acc` table
    console.log('Creating acc table...');
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS acc (
        acc_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        cleaner_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_cleaner (cleaner_id)
      );
    `);

    // 2. Fetch existing customers not yet in acc
    console.log('Migrating existing users to acc...');
    const [users] = await promiseDb.query(`
      SELECT user_id FROM users 
      WHERE user_id NOT IN (SELECT user_id FROM acc WHERE user_id IS NOT NULL)
    `);
    
    for (const user of users) {
      await promiseDb.query('INSERT INTO acc (user_id) VALUES (?)', [user.user_id]);
    }
    console.log(\`Migrated \${users.length} users.\`);

    // 3. Fetch existing cleaners not yet in acc
    console.log('Migrating existing cleaners to acc...');
    const [cleaners] = await promiseDb.query(`
      SELECT cleaner_id FROM cleaner_profile 
      WHERE cleaner_id NOT IN (SELECT cleaner_id FROM acc WHERE cleaner_id IS NOT NULL)
    `);

    for (const cleaner of cleaners) {
      await promiseDb.query('INSERT INTO acc (cleaner_id) VALUES (?)', [cleaner.cleaner_id]);
    }
    console.log(\`Migrated \${cleaners.length} cleaners.\`);

    // 4. Update messages table (if it exists and has the old columns)
    console.log('Checking messages table structure...');
    const [tables] = await promiseDb.query("SHOW TABLES LIKE 'messages'");
    if (tables.length > 0) {
      const [columns] = await promiseDb.query("SHOW COLUMNS FROM messages");
      const hasSenderAcc = columns.some(c => c.Field === 'sender_acc_id');
      
      if (!hasSenderAcc) {
        console.log('Altering messages table to use acc_id...');
        // Rename old columns to preserve data, add new acc_id columns
        await promiseDb.query(`
          ALTER TABLE messages 
          CHANGE COLUMN sender_id old_sender_id INT,
          CHANGE COLUMN receiver_id old_receiver_id INT,
          ADD COLUMN sender_id INT NOT NULL AFTER service_package_id,
          ADD COLUMN receiver_id INT NOT NULL AFTER sender_id
        `);

        // We can't automatically map old messages perfectly unless we know which old "id" was a user vs cleaner.
        // For safety, we will migrate old messages assuming old_sender_id is a User (customer) if we find them in acc.
        await promiseDb.query(`
          UPDATE messages m 
          JOIN acc a ON m.old_sender_id = a.user_id 
          SET m.sender_id = a.acc_id
        `);
        await promiseDb.query(`
          UPDATE messages m 
          JOIN acc a ON m.old_receiver_id = a.user_id 
          SET m.receiver_id = a.acc_id
        `);
        
        console.log('Messages table updated.');
      } else {
        console.log('Messages table already uses acc_id.');
      }
    } else {
      console.log('Messages table does not exist yet.');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
