const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateUserTable() {
  // Create a connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'notionuser',
    password: process.env.DB_PASSWORD || 'notionpass',
    database: process.env.DB_NAME || 'notionretro'
  });

  try {
    // Check if columns already exist
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'notionWorkspaceId'
    `);

    if (columns.length === 0) {
      console.log('Adding new columns to users table...');
      
      // Add new columns for Notion token data
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN notionWorkspaceId VARCHAR(255),
        ADD COLUMN notionWorkspaceName VARCHAR(255),
        ADD COLUMN notionBotId VARCHAR(255),
        ADD COLUMN notionTokenExpiresAt DATETIME
      `);
      
      console.log('Successfully updated users table');
    } else {
      console.log('The users table is already up to date');
    }
  } catch (error) {
    console.error('Error updating users table:', error);
  } finally {
    await connection.end();
  }
}

updateUserTable();
