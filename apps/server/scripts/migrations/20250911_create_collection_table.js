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
        CREATE TABLE IF NOT EXISTS collections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          summary TEXT,
          pageId VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
		console.log("Migration successful: create_collection_table");
	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await connection.end();
	}
}

migrate();
