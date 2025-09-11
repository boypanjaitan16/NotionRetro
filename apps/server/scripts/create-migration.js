const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Get the migration name from command line arguments
let migrationName = process.argv[2];

function createMigration() {
	// Create migrations directory if it doesn't exist
	const migrationsDir = path.join(__dirname, "migrations");
	if (!fs.existsSync(migrationsDir)) {
		fs.mkdirSync(migrationsDir, { recursive: true });
	}

	// Generate date prefix for the migration filename
	const date = new Date();
	const datePrefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

	// Create the migration file
	const filename = `${datePrefix}_${migrationName.replace(/\s+/g, "_").toLowerCase()}.js`;
	const filePath = path.join(migrationsDir, filename);

	const template = `const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Write your migration SQL here
    await connection.query(\`
      -- Your SQL queries here
    \`);
    console.log('Migration successful: ${migrationName}');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
`;

	fs.writeFileSync(filePath, template);
	console.log(`Migration file created: ${filePath}`);
	process.exit(0);
}

if (!migrationName) {
	rl.question("Enter a name for the migration: ", (answer) => {
		migrationName = answer;
		createMigration();
		rl.close();
	});
} else {
	createMigration();
}
