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
      SHOW COLUMNS FROM collections LIKE 'summary'
    `);

		if (columns.length === 0) {
			await connection.query(`ALTER TABLE collections ADD COLUMN summary TEXT`);
		}
		console.log(
			"Migration successful: Added summary column to collections table.",
		);
	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await connection.end();
	}
}

migrate();
