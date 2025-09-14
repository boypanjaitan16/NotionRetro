import type { User } from "@nretro/common/types";
import bcrypt from "bcrypt";
import type { QueryResult } from "mysql2";
import pool from "../utils/db";

export async function createUser(
	email: string,
	password: string,
	name: string,
): Promise<User> {
	const hashed = await bcrypt.hash(password, 10);
	const [result] = await pool.query(
		"INSERT INTO users (email, passwordHash, name) VALUES (?, ?, ?)",
		[email, hashed, name],
	);
	// @ts-expect-error
	const id = result.insertId;
	return { id, email, passwordHash: hashed, name, isNotionConnected: false };
}

export async function findUserByEmail(
	email: string,
): Promise<User | undefined> {
	const [rows] = await pool.query<QueryResult>(
		"SELECT * FROM users WHERE email = ?",
		[email],
	);

	// @ts-expect-error
	const user = rows.length > 0 ? (rows[0] as User) : undefined;

	if (!user) return undefined;

	user.isNotionConnected = false;

	if (user?.notionAccessToken) {
		user.isNotionConnected = true;
	}

	const { notionAccessToken: _, ...newUser } = user;

	return newUser;
}

export async function findUserById(
	id: number,
	withFullProfile = false,
): Promise<User | undefined> {
	const [rows] = await pool.query<QueryResult>(
		"SELECT * FROM users WHERE id = ?",
		[id],
	);

	// @ts-expect-error
	const user = rows.length > 0 ? (rows[0] as User) : undefined;

	if (!user) return undefined;

	user.isNotionConnected = false;

	if (user?.notionAccessToken) {
		user.isNotionConnected = true;
	}

	const { notionAccessToken: _, ...newUser } = user;

	return withFullProfile ? user : newUser;
}

export async function validateUser(
	email: string,
	password: string,
): Promise<User | null> {
	const user = await findUserByEmail(email);
	if (!user) return null;
	const valid = await bcrypt.compare(password, user.passwordHash);
	return valid ? user : null;
}

export async function updateNotionToken(
	userId: number,
	tokenData: any | null,
): Promise<void> {
	if (tokenData === null) {
		await pool.query(
			"UPDATE users SET notionAccessToken = NULL, notionWorkspaceId = NULL, notionWorkspaceName = NULL, notionBotId = NULL, notionTokenExpiresAt = NULL WHERE id = ?",
			[userId],
		);
	} else {
		// Update with new token data
		// Set expiry date to 30 days from now (Notion tokens don't have expiry by default, but we'll use this for our own tracking)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		await pool.query(
			"UPDATE users SET notionAccessToken = ?, notionWorkspaceId = ?, notionWorkspaceName = ?, notionBotId = ?, notionTokenExpiresAt = ? WHERE id = ?",
			[
				tokenData.access_token,
				tokenData.workspace_id,
				tokenData.workspace_name,
				tokenData.bot_id,
				expiresAt,
				userId,
			],
		);
	}
}
