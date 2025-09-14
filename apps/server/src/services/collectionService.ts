import type { Collection, User } from "@nretro/common/types";
import db from "../utils/db";
import { removeNotionPage, updateNotionPage } from "./notionService";

/**
 * Create a new collection
 */
export async function createCollection(
	userId: number,
	collectionData: {
		title: string;
		pageId?: string | null;
		retroParentPageId?: string | null;
		retroTitleTemplate?: string | null;
		healthCheckParentPageId?: string | null;
		healthCheckTitleTemplate?: string | null;
	},
): Promise<Collection | null> {
	const {
		title,
		pageId,
		retroParentPageId,
		retroTitleTemplate,
		healthCheckParentPageId,
		healthCheckTitleTemplate,
	} = collectionData;

	if (!title) {
		throw new Error("Collection title is required");
	}

	const [result] = await db.query(
		`INSERT INTO collections (
			userId,
			title,
			pageId,
			retroParentPageId,
			retroTitleTemplate,
			healthCheckParentPageId,
			healthCheckTitleTemplate
		) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			userId,
			title,
			pageId || null,
			retroParentPageId || null,
			retroTitleTemplate || null,
			healthCheckParentPageId || null,
			healthCheckTitleTemplate || null,
		],
	);

	const insertId = (result as { insertId: number }).insertId;

	const [rows] = await db.query("SELECT * FROM collections WHERE id = ?", [
		insertId,
	]);

	const collections = rows as unknown[];
	if (collections.length > 0) {
		return collections[0] as Collection;
	}
	return null;
}

/**
 * Get all collections for a user
 */
export async function getCollectionsByUserId(
	userId: User["id"],
): Promise<Collection[]> {
	const [rows] = await db.query("SELECT * FROM collections WHERE userId = ?", [
		userId,
	]);

	return rows as Collection[];
}

/**
 * Get a single collection by ID with its activities
 */
export async function getCollectionWithActivities(
	collectionId: number,
	userId: number,
): Promise<Collection | null> {
	// Get the collection
	const [collectionRows] = await db.query(
		"SELECT * FROM collections WHERE id = ? AND userId = ?",
		[collectionId, userId],
	);

	const collections = collectionRows as unknown[];
	if (collections.length === 0) {
		return null;
	}

	const collection = collections[0] as Collection;

	return collection;
}

/**
 * Get a single collection by ID
 */
export async function getCollectionById(
	collectionId: Collection["id"],
	userId: User["id"],
): Promise<Collection | null> {
	const [rows] = await db.query(
		"SELECT * FROM collections WHERE id = ? AND userId = ?",
		[collectionId, userId],
	);

	const collections = rows as unknown[];

	if (collections.length > 0) {
		return collections[0] as Collection;
	}
	return null;
}

/**
 * Update a collection
 */
export async function updateCollection(
	collectionId: number,
	userId: number,
	accessToken: string,
	updateData: Partial<Collection>,
): Promise<Collection | null> {
	const existingCollection = await getCollectionById(collectionId, userId);

	if (!existingCollection) {
		throw new Error("Collection not found");
	}

	const {
		title,
		pageId,
		retroParentPageId,
		retroTitleTemplate,
		healthCheckParentPageId,
		healthCheckTitleTemplate,
	} = updateData;

	// Update the collection
	await db.query(
		`UPDATE collections SET
			title = ?,
			pageId = ?,
			retroParentPageId = ?,
			retroTitleTemplate = ?,
			healthCheckParentPageId = ?,
			healthCheckTitleTemplate = ?
		WHERE id = ?`,
		[
			title || existingCollection.title,
			pageId || existingCollection.pageId,
			retroParentPageId || existingCollection.retroParentPageId,
			retroTitleTemplate || existingCollection.retroTitleTemplate,
			healthCheckParentPageId || existingCollection.healthCheckParentPageId,
			healthCheckTitleTemplate || existingCollection.healthCheckTitleTemplate,
			collectionId,
		],
	);

	if (title && existingCollection.title !== title) {
		const pageUpdated = await updateNotionPage(
			accessToken,
			existingCollection.pageId as string,
			title as string,
		);

		if (!pageUpdated) {
			throw new Error("Failed to update Notion page");
		}
	}

	return await getCollectionById(collectionId, userId);
}

/**
 * Delete a collection
 */
export async function deleteCollection(
	collectionId: Collection["id"],
	userId: User["id"],
	accessToken?: string,
): Promise<boolean> {
	const existingCollection = await getCollectionById(collectionId, userId);

	if (!existingCollection) {
		return false;
	}

	await db.query("DELETE FROM collections WHERE id = ?", [collectionId]);

	if (accessToken && existingCollection.pageId) {
		await removeNotionPage(accessToken, existingCollection.pageId);
	}

	return true;
}

/**
 * Check if a user has access to a collection
 */
export async function userHasAccessToCollection(
	userId: number,
	collectionId: number,
): Promise<boolean> {
	const [rows] = await db.query(
		"SELECT COUNT(*) as count FROM collections WHERE id = ? AND userId = ?",
		[collectionId, userId],
	);

	// Using a safer type assertion and checking
	const result = rows as unknown[];
	if (!result || !result.length) {
		return false;
	}

	// Access the count with a type guard
	const firstRow = result[0] as Record<string, unknown>;
	const count = firstRow["count"];

	return typeof count === "number" && count > 0;
}
