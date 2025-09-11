import type { Request, Response } from "express";
import db from "../../utils/db";

/**
 * Create a new collection
 */
export async function createCollection(req: Request, res: Response) {
	try {
		const { name, description } = req.body;

		if (!name) {
			return res.status(400).json({
				error: { message: "Collection name is required" },
			});
		}

		// Get user from request (added by authenticateJWT middleware)
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		const [result] = await db.query(
			"INSERT INTO collections (name, description, userId) VALUES (?, ?, ?)",
			[name, description || "", userId],
		);

		const insertId = (result as { insertId: number }).insertId;

		const [rows] = await db.query("SELECT * FROM collections WHERE id = ?", [
			insertId,
		]);

		const collection = (rows as any[])[0];

		return res.status(201).json({
			message: "Collection created successfully",
			collection,
		});
	} catch (error) {
		console.error("Create collection error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to create collection" } });
	}
}

/**
 * Get all collections for the current user
 */
export async function getCollections(req: Request, res: Response) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		const [rows] = await db.query(
			"SELECT * FROM collections WHERE userId = ?",
			[userId],
		);

		return res.json({ collections: rows });
	} catch (error) {
		console.error("Get collections error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to retrieve collections" } });
	}
}

/**
 * Get a single collection by ID
 */
export async function getCollection(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// Get the collection
		const [collectionRows] = await db.query(
			"SELECT * FROM collections WHERE id = ? AND userId = ?",
			[id, userId],
		);

		const collection = (collectionRows as any[])[0];

		if (!collection) {
			return res
				.status(404)
				.json({ error: { message: "Collection not found" } });
		}

		// Get the items in the collection
		const [itemRows] = await db.query(
			"SELECT * FROM items WHERE collectionId = ?",
			[id],
		);

		// Add items to the collection
		collection.items = itemRows;

		return res.json({ collection });
	} catch (error) {
		console.error("Get collection error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to retrieve collection" } });
	}
}

/**
 * Update a collection
 */
export async function updateCollection(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const { name, description } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// First check if the collection exists and belongs to the user
		const [rows] = await db.query(
			"SELECT * FROM collections WHERE id = ? AND userId = ?",
			[id, userId],
		);

		const existingCollection = (rows as any[])[0];

		if (!existingCollection) {
			return res
				.status(404)
				.json({ error: { message: "Collection not found" } });
		}

		// Update the collection
		await db.query(
			"UPDATE collections SET name = ?, description = ? WHERE id = ?",
			[
				name || existingCollection.name,
				description !== undefined
					? description
					: existingCollection.description,
				id,
			],
		);

		// Get the updated collection
		const [updatedRows] = await db.query(
			"SELECT * FROM collections WHERE id = ?",
			[id],
		);

		const updatedCollection = (updatedRows as any[])[0];

		return res.json({
			message: "Collection updated successfully",
			collection: updatedCollection,
		});
	} catch (error) {
		console.error("Update collection error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to update collection" } });
	}
}

/**
 * Delete a collection
 */
export async function deleteCollection(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// First check if the collection exists and belongs to the user
		const [rows] = await db.query(
			"SELECT * FROM collections WHERE id = ? AND userId = ?",
			[id, userId],
		);

		const existingCollection = (rows as any[])[0];

		if (!existingCollection) {
			return res
				.status(404)
				.json({ error: { message: "Collection not found" } });
		}

		// Delete all items in the collection first
		await db.query("DELETE FROM items WHERE collectionId = ?", [id]);

		// Delete the collection
		await db.query("DELETE FROM collections WHERE id = ?", [id]);

		return res.json({ message: "Collection deleted successfully" });
	} catch (error) {
		console.error("Delete collection error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to delete collection" } });
	}
}
