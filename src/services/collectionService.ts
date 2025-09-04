import type { Collection } from "../models/Collection";
import pool from "../utils/db";
import { createNotionPage, removeNotionPage } from "./notionService";

const REMOVE_PAGE_ON_COLLECTION_DELETION =
	process.env["APP_REMOVE_PAGE_ON_COLLECTION_DELETION"];

export async function createCollection(
	accessToken: string,
	userId: number,
	name: string,
	summary?: string,
): Promise<Collection> {
	const { id: pageId } = await createNotionPage(accessToken, name, summary);
	const [result] = await pool.query(
		"INSERT INTO collections (userId, name, summary, pageId) VALUES (?, ?, ?, ?)",
		[userId, name, summary || null, pageId],
	);
	// @ts-expect-error
	const id = result.insertId;
	const collection: Collection = {
		id,
		userId,
		name,
		pageId,
	};

	if (summary) {
		collection.summary = summary;
	}

	return collection;
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

export async function deleteCollection(
	accessToken: string,
	id: number,
): Promise<boolean> {
	const [rows] = await pool.query(
		"SELECT pageId FROM collections WHERE id = ?",
		[id],
	);
	const [result] = await pool.query("DELETE FROM collections WHERE id = ?", [
		id,
	]);

	// @ts-expect-error
	if (rows.length > 0 && REMOVE_PAGE_ON_COLLECTION_DELETION === "true") {
		// @ts-expect-error
		await removeNotionPage(accessToken, rows[0].pageId);
	}

	// @ts-expect-error
	return result.affectedRows > 0;
}
