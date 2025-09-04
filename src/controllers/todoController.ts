import type { Request, Response } from "express";
import {
	addTodo,
	deleteTodo,
	getTodosByCollection,
	updateTodo,
} from "../services/todoService";

export async function add(req: Request, res: Response) {
	const { collectionId } = req.params;
	const { title } = req.body;

	if (!collectionId || !title)
		return res.status(400).json({ error: "Missing fields" });

	try {
		await addTodo(Number(collectionId), title);
		// Redirect back to the todos page instead of returning JSON
		return res.redirect(`/collections/${collectionId}/todos`);
	} catch (error) {
		console.error("Error adding todo:", error);
		return res.status(500).json({ error: "Server error" });
	}
}

import { getDatabases, getNotionPages } from "../services/notionService";

export async function list(req: Request, res: Response) {
	const { collectionId } = req.params;
	const { success, error, databaseCreated, dbId, pageCreated, pageId } =
		req.query;

	try {
		const todos = await getTodosByCollection(Number(collectionId));
		// @ts-expect-error
		const accessToken = req.user?.notionAccessToken;
		const notionConnected = !!accessToken;
		let databases = [];
		let pages = [];

		if (accessToken) {
			try {
				console.log("Fetching databases for todo list view");
				databases = await getDatabases(accessToken);
				console.log(`Fetched ${databases.length} databases`);

				console.log("Fetching pages for todo list view");
				pages = await getNotionPages(accessToken);
				console.log(`Fetched ${pages.length} pages`);
			} catch (e) {
				console.error("Error fetching Notion data:", e);
				databases = [];
				pages = [];
			}
		}

		return res.render("todos", {
			todos,
			collectionId,
			databases,
			pages,
			notionConnected,
			success: success as string,
			error: error as string,
			databaseCreated: databaseCreated === "true",
			pageCreated: pageCreated === "true",
			selectedDatabaseId: dbId as string,
			selectedPageId: pageId as string,
		});
	} catch (error) {
		console.error("Error listing todos:", error);
		return res.status(500).render("error", { message: "Failed to load todos" });
	}
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;
	const { completed } = req.body;
	const { collectionId } = req.query; // Get collectionId from query params

	try {
		const todo = await updateTodo(Number(id), completed);
		if (!todo) return res.status(404).json({ error: "Not found" });

		// Redirect back to the todos page
		return res.redirect(`/collections/${collectionId}/todos`);
	} catch (error) {
		console.error("Error updating todo:", error);
		return res.status(500).json({ error: "Server error" });
	}
}

export async function remove(req: Request, res: Response) {
	const { id } = req.params;
	const { collectionId } = req.query; // Get collectionId from query params

	try {
		const success = await deleteTodo(Number(id));
		if (!success) return res.status(404).json({ error: "Not found" });

		// Redirect back to the todos page
		return res.redirect(`/collections/${collectionId}/todos`);
	} catch (error) {
		console.error("Error deleting todo:", error);
		return res.status(500).json({ error: "Server error" });
	}
}
