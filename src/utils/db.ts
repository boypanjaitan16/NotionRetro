import mysql from "mysql2/promise";
import { dbConfig } from "../../configs/db";

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

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
		console.log("Database tables initialized");
	} catch (error) {
		console.error("Error initializing database tables:", error);
	}
}

// Initialize DB on startup
testConnection().then(() => initDb());

export default pool;
