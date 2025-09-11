const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const readdir = promisify(fs.readdir);

async function runMigrations() {
	try {
		// Get all migration files in the migrations directory
		const migrationsDir = path.join(__dirname, "migrations");
		const files = await readdir(migrationsDir);

		// Sort migration files by filename (which should be prefixed with date)
		const migrationFiles = files.filter((file) => file.endsWith(".js")).sort();

		if (migrationFiles.length === 0) {
			console.log("No migration files found.");
			return;
		}

		console.log(`Found ${migrationFiles.length} migration files to run.`);

		// Run each migration in sequence
		for (const file of migrationFiles) {
			console.log(`Running migration: ${file}`);
			try {
				// Run the migration script
				require(path.join(migrationsDir, file));
				console.log(`Completed migration: ${file}`);
			} catch (err) {
				console.error(`Error running migration ${file}:`, err);
				process.exit(1);
			}
		}

		console.log("All migrations completed successfully.");
	} catch (err) {
		console.error("Error running migrations:", err);
		process.exit(1);
	}
}

runMigrations();
