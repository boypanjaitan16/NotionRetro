import type { Request, Response } from "express";
import * as activityService from "../../services/activityService";
import * as collectionService from "../../services/collectionService";

/**
 * Get a single activity by ID
 */
export async function getActivityById(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const activityId = parseInt(req.params["activityId"] as string, 10);

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

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

		return res.json({ activity });
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
		const userId = req.user?.id;
		const collectionId = parseInt(req.params["id"] as string, 10);
		const { title, pageId, summary, facilitators, participants, actions } =
			req.body;

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

		if (!title) {
			return res.status(400).json({ error: { message: "Title is required" } });
		}

		const activityId = await activityService.createActivity({
			collectionId,
			title,
			pageId: pageId || "",
			summary: summary || "",
			facilitators: facilitators || [],
			participants: participants || [],
			actions: actions || [],
		});

		return res.status(201).json({
			activityId,
			message: "Activity created successfully",
		});
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
		const userId = req.user?.id;
		const activityId = parseInt(req.params["activityId"] as string, 10);
		const { title, pageId, summary, facilitators, participants, actions } =
			req.body;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

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

		const success = await activityService.updateActivity({
			id: activityId,
			collectionId: activity.collectionId,
			title: title || activity.title,
			pageId: pageId !== undefined ? pageId : activity.pageId,
			summary: summary !== undefined ? summary : activity.summary,
			facilitators: facilitators || activity.facilitators,
			participants: participants || activity.participants,
			actions: actions || activity.actions,
		});

		if (!success) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		return res.json({ message: "Activity updated successfully" });
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
		const userId = req.user?.id;
		const activityId = parseInt(req.params["activityId"] as string, 10);

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

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

		const success = await activityService.deleteActivity(activityId);
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

/**
 * Add an action to an activity
 */
export async function addActionToActivity(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const activityId = parseInt(req.params["activityId"] as string, 10);
		const { title, assignee, priority, dueDate } = req.body;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!title) {
			return res
				.status(400)
				.json({ error: { message: "Action title is required" } });
		}

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

		const success = await activityService.addActionToActivity(activityId, {
			title,
			assignee: assignee || "",
			priority: priority || "medium",
			dueDate: dueDate || "",
		});

		if (!success) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		return res.json({ message: "Action added successfully" });
	} catch (error) {
		console.error("Add action error:", error);
		return res.status(500).json({ error: { message: "Failed to add action" } });
	}
}

/**
 * Update an action in an activity
 */
export async function updateActionInActivity(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const activityId = parseInt(req.params["activityId"] as string, 10);
		const actionIndex = parseInt(req.params["actionIndex"] as string, 10);
		const { title, assignee, priority, dueDate } = req.body;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		const activity = await activityService.getActivityById(activityId);
		if (!activity) {
			return res.status(404).json({ error: { message: "Activity not found" } });
		}

		if (actionIndex < 0 || actionIndex >= activity.actions.length) {
			return res.status(404).json({ error: { message: "Action not found" } });
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

		const currentAction = activity.actions[actionIndex];
		if (!currentAction) {
			return res.status(404).json({ error: { message: "Action not found" } });
		}

		const success = await activityService.updateActionInActivity(
			activityId,
			actionIndex,
			{
				title: title || currentAction.title,
				assignee: assignee !== undefined ? assignee : currentAction.assignee,
				priority: priority || currentAction.priority,
				dueDate: dueDate !== undefined ? dueDate : currentAction.dueDate,
			},
		);

		if (!success) {
			return res.status(404).json({ error: { message: "Action not found" } });
		}

		return res.json({ message: "Action updated successfully" });
	} catch (error) {
		console.error("Update action error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to update action" } });
	}
}

/**
 * Remove an action from an activity
 */
export async function removeActionFromActivity(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const activityId = parseInt(req.params["activityId"] as string, 10);
		const actionIndex = parseInt(req.params["actionIndex"] as string, 10);

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

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

		const success = await activityService.removeActionFromActivity(
			activityId,
			actionIndex,
		);
		if (!success) {
			return res.status(404).json({ error: { message: "Action not found" } });
		}

		return res.json({ message: "Action removed successfully" });
	} catch (error) {
		console.error("Remove action error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to remove action" } });
	}
}
