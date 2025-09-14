import { asInt } from "@nretro/common/utils";
import type { Request, Response } from "express";
import * as activityService from "../../services/activityService";
import * as collectionService from "../../services/collectionService";
/**
 * Get a single activity by ID
 */
export async function getActivityById(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		const activityId = parseInt(req.params["activityId"] as string, 10);

		const activity = await activityService.getActivityById(activityId);
		if (!activity) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		// Verify user has access to collection
		const hasAccess = await collectionService.userHasAccessToCollection(
			userId,
			activity.collectionId,
		);
		if (!hasAccess) {
			return res
				.status(403)
				.json({ error: { message: "Access denied to this activity" } });
		}

		return res.json(activity);
	} catch (error) {
		console.error("Get activity error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to get activity" } });
	}
}

/**
 * Create a new activity
 */
export async function createActivity(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		const collectionId = asInt(req.params["id"]);
		const { title, summary, facilitator, participants, actions } = req.body;

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

		if (!title) {
			return res.status(400).json({ error: { message: "Title is required" } });
		}

		const activity = await activityService.createActivity({
			collectionId,
			title,
			pageId: "",
			summary: summary || "",
			facilitator: facilitator,
			participants: participants || [],
			actions: actions || [],
		});

		return res.status(201).json(activity);
	} catch (error) {
		console.error("Create activity error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to create activity" } });
	}
}

/**
 * Update an existing activity
 */
export async function updateActivity(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		const activityId = asInt(req.params["activityId"]);
		const { title, summary, facilitator, participants, actions } = req.body;

		const activity = await activityService.getActivityById(activityId);
		if (!activity) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		const hasAccess = await collectionService.userHasAccessToCollection(
			userId,
			activity.collectionId,
		);

		if (!hasAccess) {
			return res
				.status(403)
				.json({ error: { message: "Access denied to this activity" } });
		}

		const updatedActivity = await activityService.updateActivity(activityId, {
			title: title,
			summary: summary,
			facilitator: facilitator,
			participants: participants,
			actions: actions,
		});

		return res.json(updatedActivity);
	} catch (error) {
		console.error("Update activity error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to update activity" } });
	}
}

/**
 * Delete an activity
 */
export async function deleteActivity(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		const notionAccessToken = req.user?.notionAccessToken as string;
		const activityId = asInt(req.params["activityId"]);

		const activity = await activityService.getActivityById(activityId);
		if (!activity) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		// Verify user has access to collection
		const hasAccess = await collectionService.userHasAccessToCollection(
			userId,
			activity.collectionId,
		);
		if (!hasAccess) {
			return res
				.status(403)
				.json({ error: { message: "Access denied to this activity" } });
		}

		const success = await activityService.deleteActivity(
			activityId,
			notionAccessToken,
		);
		if (!success) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		return res.json({ message: "Activity deleted successfully" });
	} catch (error) {
		console.error("Delete activity error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to delete activity" } });
	}
}

export async function publishActivityToNotion(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		const notionAccessToken = req.user?.notionAccessToken as string;
		const activityId = asInt(req.params["activityId"]);

		const succeed = await activityService.publishToNotion(
			activityId,
			userId,
			notionAccessToken,
		);

		if (succeed) {
			return res.json({ message: "Activity published to Notion successfully" });
		}

		return res
			.status(500)
			.json({ error: { message: "Failed to publish activity to Notion" } });
	} catch (error) {
		console.error("Publish activity to Notion error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to publish activity to Notion" } });
	}
}
