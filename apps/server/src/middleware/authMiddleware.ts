import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "../models/User";
import pool from "../utils/db";

// TypeScript extension for Request to include user property
declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}

const JWT_SECRET = process.env["JWT_SECRET"] || "secret";

// Check if user is authenticated without requiring authentication
export async function checkAuth(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	// Check for token in cookies (for browser sessions)
	let token = req.cookies ? req.cookies["token"] : undefined;

	// Also check Authorization header (for API calls)
	if (!token) {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			token = authHeader.split(" ")[1];
		}
	}

	if (!token) {
		// No token found, but that's okay, continue without setting user
		return next();
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		// Get the latest user data from database
		const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
			decoded.id,
		]);

		// @ts-expect-error
		if (rows.length > 0) {
			// Set user in request object
			// @ts-expect-error
			req.user = rows[0] as User;
		}
		return next();
	} catch (err) {
		// Invalid token, but that's okay, continue without setting user
		return next();
	}
}

export async function authenticateJWT(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// Check for token in cookies (for browser sessions)
	let token = req.cookies ? req.cookies["token"] : undefined;

	// Also check Authorization header (for API calls)
	if (!token) {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			token = authHeader.split(" ")[1];
		}
	}

	if (!token) return res.status(401).json({ error: "No token provided" });

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		// Get the latest user data from database
		const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
			decoded.id,
		]);

		// @ts-expect-error
		if (rows.length === 0) {
			return res.status(401).json({ error: "User not found" });
		}

		// Set user in request object
		// @ts-expect-error
		req.user = rows[0] as User;
		return next();
	} catch (err) {
		return res.status(403).json({ error: "Invalid token" });
	}
}
