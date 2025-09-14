import type { User } from "@nretro/common/types";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../services/userService";

// TypeScript extension for Request to include user property
declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}

const JWT_SECRET = process.env["JWT_SECRET"] || "secret";

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
		return next();
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		const user = await findUserById(decoded.id);

		if (user) {
			req.user = user;
		}
		return next();
	} catch (err) {
		return next();
	}
}

export async function authenticateJWT(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	let token = req.cookies ? req.cookies["token"] : undefined;

	if (!token) {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			token = authHeader.split(" ")[1];
		}
	}

	if (!token) return res.status(401).json({ error: "No token provided" });

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		const user = await findUserById(decoded.id, true);

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		req.user = user;
		return next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token" });
	}
}
