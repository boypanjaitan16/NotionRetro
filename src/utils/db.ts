import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

// Configure MySQL connection
const config = {
	host: process.env["DB_HOST"] || "localhost",
	port: parseInt(process.env["DB_PORT"] || "3306"),
	user: process.env["DB_USER"] || "notionuser",
	password: process.env["DB_PASSWORD"] || "notionpass",
	database: process.env["DB_NAME"] || "notionretro",
};

// Create MySQL connection pool
const pool = mysql.createPool(config);

// Test the connection
async function testConnection() {
	try {
		const connection = await pool.getConnection();
		console.log("MySQL connection established");
		connection.release();
	} catch (error) {
		console.error("MySQL connection error:", error);
	}
}

// Initialize database tables
async function initDb() {
	try {
		const connection = await pool.getConnection();

		// Create Users table
		await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        notionAccessToken VARCHAR(255),
        notionWorkspaceId VARCHAR(255),
        notionWorkspaceName VARCHAR(255),
        notionBotId VARCHAR(255),
        notionTokenExpiresAt DATETIME
      )
    `);

		// Create Collections table
		await connection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

		// Create Todos table
		await connection.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        collectionId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT false,
        FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE
      )
    `);

		connection.release();
		console.log("Database tables initialized");
	} catch (error) {
		console.error("Error initializing database tables:", error);
	}
}

// Initialize DB on startup
testConnection().then(() => initDb());

export default pool;
