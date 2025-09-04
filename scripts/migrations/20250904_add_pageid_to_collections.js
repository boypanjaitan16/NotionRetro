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
		const [columns] = await connection.query(`
      SHOW COLUMNS FROM collections LIKE 'pageId'
    `);

		if (columns.length === 0) {
			await connection.query(
				`ALTER TABLE collections ADD COLUMN pageId VARCHAR(255)`,
			);
		}
		console.log(
			"Migration successful: Added pageId column to collections table.",
		);
	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await connection.end();
	}
}

migrate();
