import type { Action, Activity, User } from "@nretro/common/types";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../utils/db";
import { getCollectionById } from "./collectionService";
import {
	createNotionPage,
	removeNotionPage,
	updateNotionPage,
} from "./notionService";

const APP_NAME = process.env["APP_NAME"] || "NotionRetro";

type ActivityWithOptionalId = Omit<Activity, "id"> & { id?: number };

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

	return rows as Activity[];
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

	return rows[0] as Activity;
}

/**
 * Create a new activity
 */
export async function createActivity(
	activity: ActivityWithOptionalId,
): Promise<Activity | null> {
	const collectionId = activity.collectionId;
	const [result] = await db.query<ResultSetHeader>(
		`INSERT INTO activities (collectionId, title, summary, facilitator, participants, actions)
     VALUES (?, ?, ?, ?, ?, ?)`,
		[
			collectionId,
			activity.title,
			activity.summary,
			activity.facilitator,
			JSON.stringify(activity.participants || []),
			JSON.stringify(activity.actions || []),
		],
	);

	const insertId = (result as { insertId: number }).insertId;

	const [rows] = await db.query("SELECT * FROM activities WHERE id = ?", [
		insertId,
	]);

	const collections = rows as unknown[];
	if (collections.length > 0) {
		return collections[0] as Activity;
	}
	return null;
}

/**
 * Update an existing activity
 */
export async function updateActivity(
	activityId: Activity["id"],
	updateData: Partial<Activity>,
): Promise<Activity | null> {
	const existingActivity = await getActivityById(activityId);
	if (!existingActivity) {
		throw new Error("Activity not found");
	}

	const { title, pageId, summary, facilitator, participants, actions } =
		updateData;

	await db.query<ResultSetHeader>(
		`UPDATE activities
     SET title = ?, pageId = ?, summary = ?,
         facilitator = ?, participants = ?, actions = ?
     WHERE id = ?`,
		[
			title || existingActivity.title,
			pageId || existingActivity.pageId,
			summary || existingActivity.summary,
			facilitator || existingActivity.facilitator,
			JSON.stringify(participants || existingActivity.participants),
			JSON.stringify(actions || existingActivity.actions),
			activityId,
		],
	);

	return await getActivityById(activityId);
}

/**
 * Delete an activity
 */
export async function deleteActivity(
	activityId: number,
	notionAccessToken: string,
): Promise<boolean> {
	const exisitingActivity = await getActivityById(activityId);
	if (!exisitingActivity) {
		return false;
	}

	if (exisitingActivity.pageId) {
		await removeNotionPage(notionAccessToken, exisitingActivity.pageId);
	}

	const [result] = await db.query<ResultSetHeader>(
		`DELETE FROM activities WHERE id = ?`,
		[activityId],
	);

	return result.affectedRows > 0;
}

export async function publishToNotion(
	activityId: Activity["id"],
	userId: User["id"],
	notionAccessToken: string,
): Promise<{
	id: string;
	url: string;
	title: string;
}> {
	const activity = await getActivityById(activityId);
	if (!activity) {
		throw new Error("Activity not found");
	}

	const collection = await getCollectionById(activity.collectionId, userId);

	if (!collection) {
		throw new Error("Collection not found");
	}

	const { participants, actions, summary, facilitator } = activity;
	const participantsBlocks = (participants || []).map(
		(participant: string) => ({
			object: "block",
			type: "bulleted_list_item",
			bulleted_list_item: {
				rich_text: [{ type: "text", text: { content: participant } }],
			},
		}),
	);
	const actionsBodyBlocks = (actions || []).map((action: Action) => ({
		object: "block",
		type: "table_row",
		table_row: {
			cells: [
				[{ type: "text", text: { content: action.title } }],
				[{ type: "text", text: { content: action.dueDate } }],
				[{ type: "text", text: { content: action.assignee } }],
				[{ type: "text", text: { content: action.priority } }],
			],
		},
	}));
	const children = [
		{
			object: "block",
			type: "paragraph",
			paragraph: {
				rich_text: [
					{ type: "text", text: { content: `Created by ${APP_NAME}` } },
				],
			},
		},
		{
			object: "block",
			type: "heading_3",
			heading_3: {
				rich_text: [{ type: "text", text: { content: "Summary" } }],
			},
		},
		{
			object: "block",
			type: "paragraph",
			paragraph: {
				rich_text: [{ type: "text", text: { content: summary } }],
			},
		},
		{
			object: "block",
			type: "heading_3",
			heading_3: {
				rich_text: [{ type: "text", text: { content: "Facilitator" } }],
			},
		},
		{
			object: "block",
			type: "bulleted_list_item",
			bulleted_list_item: {
				rich_text: [{ type: "text", text: { content: facilitator } }],
			},
		},
		{
			object: "block",
			type: "heading_3",
			heading_3: {
				rich_text: [{ type: "text", text: { content: "Participants" } }],
			},
		},
		...participantsBlocks,
		{
			object: "block",
			type: "heading_3",
			heading_3: {
				rich_text: [{ type: "text", text: { content: "Not present" } }],
			},
		},

		{
			object: "block",
			type: "heading_2",
			heading_2: {
				rich_text: [{ type: "text", text: { content: "Action Plan" } }],
			},
		},
		{
			object: "block",
			type: "heading_3",
			heading_3: {
				rich_text: [{ type: "text", text: { content: "New Actions" } }],
			},
		},
		{
			object: "block",
			type: "table",
			table: {
				table_width: 4,
				has_column_header: true,
				has_row_header: false,
				children: [
					{
						object: "block",
						type: "table_row",
						table_row: {
							cells: [
								[{ type: "text", text: { content: "Action" } }],
								[{ type: "text", text: { content: "Due Date" } }],
								[{ type: "text", text: { content: "Assigned to" } }],
								[{ type: "text", text: { content: "Priority" } }],
							],
						},
					},
					...actionsBodyBlocks,
				],
			},
		},
	];

	let page = null;

	if (activity.pageId) {
		page = await updateNotionPage(
			notionAccessToken,
			activity.pageId,
			activity.title,
			children,
		);
	} else {
		page = await createNotionPage(
			notionAccessToken,
			activity.title,
			collection.pageId,
			children,
		);
	}

	await updateActivity(activityId, { pageId: page.id });
	return page;
}
