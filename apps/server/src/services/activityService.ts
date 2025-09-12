import type { Action, Activity } from "@nretro/common/types";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../utils/db";

type ActivityWithOptionalId = Omit<Activity, "id"> & { id?: number };

/**
 * Convert database row to Activity object
 */
function rowToActivity(row: Record<string, any>): Activity {
	return {
		id: row["id"],
		collectionId: row["collectionId"],
		title: row["title"],
		pageId: row["pageId"],
		summary: row["summary"],
		facilitators: JSON.parse(row["facilitators"] || "[]"),
		participants: JSON.parse(row["participants"] || "[]"),
		actions: JSON.parse(row["actions"] || "[]"),
	};
}

/**
 * Get all activities for a collection
 */
export async function getActivitiesByCollection(
	collectionId: number,
): Promise<Activity[]> {
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT * FROM activities WHERE collectionId = ?`,
		[collectionId],
	);

	return (rows as Record<string, any>[]).map((row) => rowToActivity(row));
}

/**
 * Get activity by ID
 */
export async function getActivityById(
	activityId: number,
): Promise<Activity | null> {
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT * FROM activities WHERE id = ?`,
		[activityId],
	);

	if (!rows.length) return null;

	return rowToActivity(rows[0] as Record<string, any>);
}

/**
 * Create a new activity
 */
export async function createActivity(
	activity: ActivityWithOptionalId,
): Promise<number> {
	const [result] = await db.query<ResultSetHeader>(
		`INSERT INTO activities (collectionId, title, pageId, summary, facilitators, participants, actions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			activity.collectionId,
			activity.title,
			activity.pageId,
			activity.summary,
			JSON.stringify(activity.facilitators || []),
			JSON.stringify(activity.participants || []),
			JSON.stringify(activity.actions || []),
		],
	);

	return result.insertId;
}

/**
 * Update an existing activity
 */
export async function updateActivity(activity: Activity): Promise<boolean> {
	const [result] = await db.query<ResultSetHeader>(
		`UPDATE activities
     SET collectionId = ?, title = ?, pageId = ?, summary = ?,
         facilitators = ?, participants = ?, actions = ?
     WHERE id = ?`,
		[
			activity.collectionId,
			activity.title,
			activity.pageId,
			activity.summary,
			JSON.stringify(activity.facilitators || []),
			JSON.stringify(activity.participants || []),
			JSON.stringify(activity.actions || []),
			activity.id,
		],
	);

	return result.affectedRows > 0;
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: number): Promise<boolean> {
	const [result] = await db.query<ResultSetHeader>(
		`DELETE FROM activities WHERE id = ?`,
		[activityId],
	);

	return result.affectedRows > 0;
}

/**
 * Add an action to an activity
 */
export async function addActionToActivity(
	activityId: number,
	action: Action,
): Promise<boolean> {
	const activity = await getActivityById(activityId);
	if (!activity) return false;

	activity.actions.push(action);

	return updateActivity(activity);
}

/**
 * Update an action in an activity
 */
export async function updateActionInActivity(
	activityId: number,
	actionIndex: number,
	updatedAction: Action,
): Promise<boolean> {
	const activity = await getActivityById(activityId);
	if (!activity || actionIndex < 0 || actionIndex >= activity.actions.length) {
		return false;
	}

	activity.actions[actionIndex] = updatedAction;

	return updateActivity(activity);
}

/**
 * Remove an action from an activity
 */
export async function removeActionFromActivity(
	activityId: number,
	actionIndex: number,
): Promise<boolean> {
	const activity = await getActivityById(activityId);
	if (!activity || actionIndex < 0 || actionIndex >= activity.actions.length) {
		return false;
	}

	activity.actions.splice(actionIndex, 1);

	return updateActivity(activity);
}
