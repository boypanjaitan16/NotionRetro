import mysql from "mysql2/promise";
import { dbConfig } from "../../configs/db.js";

async function migrate() {
	const connection = await mysql.createConnection(dbConfig);

	try {
		// Check if columns already exist
		const [columns] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'notionWorkspaceId'
    `);

		if (columns.length === 0) {
			console.log("Adding new columns to users table...");

			// Add new columns for Notion token data
			await connection.query(`
        ALTER TABLE users
        ADD COLUMN notionWorkspaceId VARCHAR(255),
        ADD COLUMN notionWorkspaceName VARCHAR(255),
        ADD COLUMN notionBotId VARCHAR(255),
        ADD COLUMN notionTokenExpiresAt DATETIME
      `);

			console.log("Successfully updated users table");
		} else {
			console.log("The users table is already up to date");
		}
	} catch (error) {
		console.error("Error updating users table:", error);
	} finally {
		await connection.end();
	}
}

migrate();
