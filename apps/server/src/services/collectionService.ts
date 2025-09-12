import db from "../utils/db";
import { removeNotionPage } from "./notionService";

// Database record type
export type CollectionRecord = {
	id: number;
	userId: number;
	title: string;
	pageId: string | null;
	retroParentPageId: string | null;
	retroTitleTemplate: string | null;
	healthCheckParentPageId: string | null;
	healthCheckTitleTemplate: string | null;
};

// Extended record with items
export interface CollectionWithItems extends CollectionRecord {
	items: unknown[]; // Using unknown[] instead of any[]
}

const REMOVE_PAGE_ON_COLLECTION_DELETION =
	process.env["APP_REMOVE_PAGE_ON_COLLECTION_DELETION"];

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
): Promise<CollectionRecord | null> {
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
		return collections[0] as CollectionRecord;
	}
	return null;
}

/**
 * Get all collections for a user
 */
export async function getCollectionsByUserId(
	userId: number,
): Promise<CollectionRecord[]> {
	const [rows] = await db.query("SELECT * FROM collections WHERE userId = ?", [
		userId,
	]);

	return rows as CollectionRecord[];
}

/**
 * Get a single collection by ID with its items
 */
export async function getCollectionWithItems(
	collectionId: number,
	userId: number,
): Promise<CollectionWithItems | null> {
	// Get the collection
	const [collectionRows] = await db.query(
		"SELECT * FROM collections WHERE id = ? AND userId = ?",
		[collectionId, userId],
	);

	const collections = collectionRows as unknown[];
	if (collections.length === 0) {
		return null;
	}

	const collection = collections[0] as CollectionWithItems;

	// Get the items in the collection
	const [itemRows] = await db.query(
		"SELECT * FROM items WHERE collectionId = ?",
		[collectionId],
	);

	// Add items to the collection
	collection.items = Array.isArray(itemRows) ? itemRows : [];

	return collection;
}

/**
 * Get a single collection by ID
 */
export async function getCollectionById(
	collectionId: number,
	userId: number,
): Promise<CollectionRecord | null> {
	const [rows] = await db.query(
		"SELECT * FROM collections WHERE id = ? AND userId = ?",
		[collectionId, userId],
	);

	const collections = rows as unknown[];

	if (collections.length > 0) {
		return collections[0] as CollectionRecord;
	}
	return null;
}

/**
 * Update a collection
 */
export async function updateCollection(
	collectionId: number,
	userId: number,
	updateData: {
		title?: string;
		pageId?: string | null;
		retroParentPageId?: string | null;
		retroTitleTemplate?: string | null;
		healthCheckParentPageId?: string | null;
		healthCheckTitleTemplate?: string | null;
	},
): Promise<CollectionRecord | null> {
	// First check if the collection exists and belongs to the user
	const existingCollection = await getCollectionById(collectionId, userId);

	if (!existingCollection) {
		return null;
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
			title !== undefined ? title : existingCollection.title,
			pageId !== undefined ? pageId : existingCollection.pageId,
			retroParentPageId !== undefined
				? retroParentPageId
				: existingCollection.retroParentPageId,
			retroTitleTemplate !== undefined
				? retroTitleTemplate
				: existingCollection.retroTitleTemplate,
			healthCheckParentPageId !== undefined
				? healthCheckParentPageId
				: existingCollection.healthCheckParentPageId,
			healthCheckTitleTemplate !== undefined
				? healthCheckTitleTemplate
				: existingCollection.healthCheckTitleTemplate,
			collectionId,
		],
	);

	// Get the updated collection
	return await getCollectionById(collectionId, userId);
}

/**
 * Delete a collection
 */
export async function deleteCollection(
	collectionId: number,
	userId: number,
	accessToken?: string,
): Promise<boolean> {
	// First check if the collection exists and belongs to the user
	const existingCollection = await getCollectionById(collectionId, userId);

	if (!existingCollection) {
		return false;
	}

	// Delete all items in the collection first
	await db.query("DELETE FROM items WHERE collectionId = ?", [collectionId]);

	// Delete the collection
	await db.query("DELETE FROM collections WHERE id = ?", [collectionId]);

	// If configured and we have an access token, delete the Notion page
	if (
		accessToken &&
		existingCollection.pageId &&
		REMOVE_PAGE_ON_COLLECTION_DELETION === "true"
	) {
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
