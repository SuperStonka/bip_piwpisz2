const mysql = require('mysql2/promise');
require('dotenv').config();

async function addUserNames() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bip_www_cms'
    });

    console.log('Connected to database');

    // Add firstName and lastName columns to users table
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN firstName VARCHAR(100) NULL AFTER username,
      ADD COLUMN lastName VARCHAR(100) NULL AFTER firstName
    `);

    console.log('Added firstName and lastName columns to users table');

    // Update existing users with default names based on username
    await connection.execute(`
      UPDATE users 
      SET firstName = SUBSTRING_INDEX(username, ' ', 1),
          lastName = CASE 
            WHEN LOCATE(' ', username) > 0 
            THEN SUBSTRING(username, LOCATE(' ', username) + 1)
            ELSE ''
          END
      WHERE firstName IS NULL OR lastName IS NULL
    `);

    console.log('Updated existing users with names from username');

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
addUserNames();
