import type { Collection } from "../models/Collection";
import pool from "../utils/db";

export async function createCollection(
	userId: number,
	name: string,
): Promise<Collection> {
	const [result] = await pool.query(
		"INSERT INTO collections (userId, name) VALUES (?, ?)",
		[userId, name],
	);
	// @ts-expect-error
	const id = result.insertId;
	return { id, userId, name };
}

export async function getCollectionsByUser(
	userId: number,
): Promise<Collection[]> {
	const [rows] = await pool.query(
		"SELECT * FROM collections WHERE userId = ?",
		[userId],
	);
	// @ts-expect-error
	return rows;
}

export async function getCollectionById(
	id: number,
): Promise<Collection | undefined> {
	const [rows] = await pool.query("SELECT * FROM collections WHERE id = ?", [
		id,
	]);
	// @ts-expect-error
	return rows.length > 0 ? rows[0] : undefined;
}

export async function deleteCollection(id: number): Promise<boolean> {
	const [result] = await pool.query("DELETE FROM collections WHERE id = ?", [
		id,
	]);
	// @ts-expect-error
	return result.affectedRows > 0;
}
