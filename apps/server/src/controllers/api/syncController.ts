import axios from "axios";
import type { Request, Response } from "express";
import db from "../../utils/db";

/**
 * Sync a Notion database to a collection
 */
export async function syncNotionDatabase(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const { databaseId, collectionId, mappings } = req.body;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!databaseId) {
			return res
				.status(400)
				.json({ error: { message: "Database ID is required" } });
		}

		if (!collectionId) {
			return res
				.status(400)
				.json({ error: { message: "Collection ID is required" } });
		}

		if (!mappings) {
			return res
				.status(400)
				.json({ error: { message: "Field mappings are required" } });
		}

		// Get the user's Notion access token
		const [userRows] = await db.query(
			"SELECT notionAccessToken FROM users WHERE id = ?",
			[userId],
		);

		const user = (userRows as any[])[0];

		if (!user || !user.notionAccessToken) {
			return res
				.status(400)
				.json({ error: { message: "Notion not connected" } });
		}

		// Initialize axios for Notion API
		const notionApiClient = axios.create({
			baseURL: "https://api.notion.com/v1",
			headers: {
				Authorization: `Bearer ${user.notionAccessToken}`,
				"Notion-Version": "2022-06-28",
				"Content-Type": "application/json",
			},
		});

		// Create a sync record
		const [syncResult] = await db.query(
			"INSERT INTO syncs (userId, collectionId, databaseId, status, mappings) VALUES (?, ?, ?, ?, ?)",
			[userId, collectionId, databaseId, "running", JSON.stringify(mappings)],
		);

		const syncId = (syncResult as { insertId: number }).insertId;

		// Start the sync process asynchronously
		startSyncProcess(
			syncId,
			notionApiClient,
			databaseId,
			collectionId,
			mappings,
		).catch((error) => {
			console.error("Sync process error:", error);
			// Update sync status to failed
			db.query("UPDATE syncs SET status = ?, error = ? WHERE id = ?", [
				"failed",
				error instanceof Error ? error.message : String(error),
				syncId,
			]).catch((err) => console.error("Error updating sync status:", err));
		});

		return res.json({
			message: "Sync started",
			syncId,
		});
	} catch (error) {
		console.error("Sync error:", error);
		return res.status(500).json({ error: { message: "Failed to start sync" } });
	}
}

/**
 * Get sync history for the current user
 */
export async function getSyncHistory(req: Request, res: Response) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		const [rows] = await db.query(
			`SELECT s.*, c.name as collectionName
       FROM syncs s
       JOIN collections c ON s.collectionId = c.id
       WHERE s.userId = ?
       ORDER BY s.createdAt DESC`,
			[userId],
		);

		return res.json({ syncs: rows });
	} catch (error) {
		console.error("Get sync history error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to get sync history" } });
	}
}

/**
 * Get sync status
 */
export async function getSyncStatus(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const { syncId } = req.params;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		const [rows] = await db.query(
			"SELECT * FROM syncs WHERE id = ? AND userId = ?",
			[syncId, userId],
		);

		const sync = (rows as any[])[0];

		if (!sync) {
			return res.status(404).json({ error: { message: "Sync not found" } });
		}

		return res.json({ sync });
	} catch (error) {
		console.error("Get sync status error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to get sync status" } });
	}
}

/**
 * Start the sync process
 */
async function startSyncProcess(
	syncId: number,
	notionApiClient: ReturnType<typeof axios.create>,
	databaseId: string,
	collectionId: string,
	mappings: Record<string, string>,
) {
	try {
		// Query the Notion database
		const response = await notionApiClient.post(
			`/databases/${databaseId}/query`,
		);
		const results = response.data.results;
		const items = results.map((page: any) => {
			const item: Record<string, unknown> = {
				collectionId,
				notionPageId: page.id,
			};

			// Extract properties based on mappings
			for (const [field, propertyId] of Object.entries(mappings)) {
				const property = page.properties[propertyId];
				item[field] = extractPropertyValue(property);
			}

			return item;
		});

		// Begin a transaction
		const connection = await db.getConnection();
		try {
			await connection.beginTransaction();

			// Clear existing items in the collection
			await connection.query("DELETE FROM items WHERE collectionId = ?", [
				collectionId,
			]);

			// Insert new items
			for (const item of items) {
				const { collectionId, content, status, notionPageId } = item;
				await connection.query(
					"INSERT INTO items (collectionId, content, status, notionPageId) VALUES (?, ?, ?, ?)",
					[collectionId, content, status, notionPageId],
				);
			}

			// Update sync status
			await connection.query(
				"UPDATE syncs SET status = ?, itemCount = ?, completedAt = NOW() WHERE id = ?",
				["completed", items.length, syncId],
			);

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	} catch (error) {
		// Update sync status to failed
		await db.query("UPDATE syncs SET status = ?, error = ? WHERE id = ?", [
			"failed",
			error instanceof Error ? error.message : String(error),
			syncId,
		]);

		throw error;
	}
}

/**
 * Extract the value from a Notion property
 */
function extractPropertyValue(property: Record<string, unknown>): unknown {
	if (!property) return null;

	const type = property["type"] as string;
	switch (type) {
		case "title":
			return (property["title"] as Array<{ plain_text: string }>)
				.map((t) => t.plain_text)
				.join("");
		case "rich_text":
			return (property["rich_text"] as Array<{ plain_text: string }>)
				.map((t) => t.plain_text)
				.join("");
		case "number":
			return property["number"];
		case "select":
			return (property["select"] as { name: string })?.name;
		case "multi_select":
			return (property["multi_select"] as Array<{ name: string }>)
				.map((s) => s.name)
				.join(", ");
		case "date":
			return (property["date"] as { start: string })?.start;
		case "checkbox":
			return property["checkbox"];
		default:
			return JSON.stringify(property);
	}
}
