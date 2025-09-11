const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrate() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	});

	try {
		// Write your migration SQL here
		await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255),
          passwordHash VARCHAR(255) NOT NULL,
          notionAccessToken VARCHAR(255),
          notionWorkspaceId VARCHAR(255),
          notionWorkspaceName VARCHAR(255),
          notionBotId VARCHAR(255),
          notionTokenExpiresAt DATETIME,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
		console.log("Migration successful: create_user_table");
	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await connection.end();
	}
}

migrate();
