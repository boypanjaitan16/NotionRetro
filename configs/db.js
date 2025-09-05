import dotenv from "dotenv";

dotenv.config();

export const dbConfig = {
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "user",
	password: process.env.DB_PASSWORD || "password",
	database: process.env.DB_NAME || "database",
};
