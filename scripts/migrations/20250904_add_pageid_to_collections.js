import mysql from "mysql2/promise";
import { dbConfig } from "../../configs/db.js";

async function migrate() {
	const connection = await mysql.createConnection(dbConfig);

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
