import type { Request, Response } from "express";
import type { Secret, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { createUser, validateUser } from "../../services/userService";

// Define the sign function with the proper types
const jwtSign = (
	payload: string | Buffer | object,
	secretOrPrivateKey: Secret,
	options?: SignOptions,
): string => {
	return jwt.sign(payload, secretOrPrivateKey, options);
};

const JWT_SECRET = process.env["JWT_SECRET"] || "secret";
const JWT_EXPIRES_IN = process.env["JWT_EXPIRES_IN"] || "1d";

/**
 * Register a new user
 */
export async function signup(req: Request, res: Response) {
	try {
		const { email, password, name } = req.body;

		if (!email || !password || !name) {
			return res.status(400).json({
				error: {
					message: "Missing required fields",
					fields: ["email", "password", "name"],
				},
			});
		}

		const user = await createUser(email, password, name);
		const token = jwtSign({ id: user.id, email: user.email }, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN,
		} as SignOptions);

		return res.status(201).json({
			message: "User created successfully",
			user: { id: user.id, email: user.email },
			token,
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("duplicate")) {
			return res
				.status(409)
				.json({ error: { message: "Email already in use" } });
		}

		console.error("Signup error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to create user" } });
	}
}

/**
 * Login a user
 */
export async function login(req: Request, res: Response) {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				error: {
					message: "Missing required fields",
					fields: ["email", "password"],
				},
			});
		}

		const user = await validateUser(email, password);

		if (!user) {
			return res
				.status(401)
				.json({ error: { message: "Invalid credentials" } });
		}

		const token = jwtSign({ id: user.id, email: user.email }, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN,
		} as SignOptions);

		// Still set the cookie for backward compatibility, but primarily return the token in the response
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env["NODE_ENV"] === "production",
			sameSite: "strict",
			maxAge: 24 * 60 * 60 * 1000, // 1 day
		});

		return res.json({
			message: "Login successful",
			user: { id: user.id, email: user.email },
			token,
		});
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({ error: { message: "Login failed" } });
	}
}

/**
 * Logout a user
 */
export async function logout(_req: Request, res: Response) {
	res.clearCookie("token");
	return res.json({ message: "Logout successful" });
}

/**
 * Get the current user
 */
export async function getCurrentUser(req: Request, res: Response) {
	if (!req.user) {
		return res.status(401).json({ error: { message: "Not authenticated" } });
	}

	return res.json({
		user: {
			id: req.user.id,
			email: req.user.email,
			notionConnected: !!req.user.notionAccessToken,
		},
	});
}
