import type { Request, Response } from "express";
import * as activityService from "../../services/activityService";
import * as collectionService from "../../services/collectionService";

/**
 * Get all activities for a collection
 */
export async function getActivitiesByCollection(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const collectionId = parseInt(req.params["id"] as string, 10);

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// Verify user has access to collection
		const hasAccess = await collectionService.userHasAccessToCollection(
			userId,
			collectionId,
		);
		if (!hasAccess) {
			return res
				.status(403)
				.json({ error: { message: "Access denied to this collection" } });
		}

		const activities =
			await activityService.getActivitiesByCollection(collectionId);
		return res.json({ activities });
	} catch (error) {
		console.error("Get activities error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to get activities" } });
	}
}

/**
 * Create a new collection
 */
export async function createCollection(req: Request, res: Response) {
	try {
		const {
			title,
			pageId,
			retroParentPageId,
			retroTitleTemplate,
			healthCheckParentPageId,
			healthCheckTitleTemplate,
		} = req.body;

		if (!title) {
			return res.status(400).json({
				error: { message: "Collection title is required" },
			});
		}

		// Get user from request (added by authenticateJWT middleware)
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		const collection = await collectionService.createCollection(userId, {
			title,
			pageId,
			retroParentPageId,
			retroTitleTemplate,
			healthCheckParentPageId,
			healthCheckTitleTemplate,
		});

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

		const collections = await collectionService.getCollectionsByUserId(userId);

		return res.json({ collections });
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
		const id = req.params["id"];
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!id) {
			return res.status(400).json({
				error: { message: "Collection ID is required" },
			});
		}

		const collection = await collectionService.getCollectionWithItems(
			parseInt(id, 10),
			userId,
		);

		if (!collection) {
			return res
				.status(404)
				.json({ error: { message: "Collection not found" } });
		}

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
		const id = req.params["id"];
		const {
			title,
			pageId,
			retroParentPageId,
			retroTitleTemplate,
			healthCheckParentPageId,
			healthCheckTitleTemplate,
		} = req.body;

		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!id) {
			return res.status(400).json({
				error: { message: "Collection ID is required" },
			});
		}

		const updatedCollection = await collectionService.updateCollection(
			parseInt(id, 10),
			userId,
			{
				title,
				pageId,
				retroParentPageId,
				retroTitleTemplate,
				healthCheckParentPageId,
				healthCheckTitleTemplate,
			},
		);

		if (!updatedCollection) {
			return res
				.status(404)
				.json({ error: { message: "Collection not found" } });
		}

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
		const id = req.params["id"];
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!id) {
			return res.status(400).json({
				error: { message: "Collection ID is required" },
			});
		}

		const success = await collectionService.deleteCollection(
			parseInt(id, 10),
			userId,
		);

		if (!success) {
			return res
				.status(404)
				.json({ error: { message: "Collection not found" } });
		}

		return res.json({ message: "Collection deleted successfully" });
	} catch (error) {
		console.error("Delete collection error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to delete collection" } });
	}
}
