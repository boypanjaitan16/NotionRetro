import type { Request, Response } from "express";
import {
	createCollection,
	deleteCollection,
	getCollectionsByUser,
} from "../services/collectionService";

export async function create(req: Request, res: Response) {
	const userId = req.user?.id;
	const accessToken = req.user?.notionAccessToken;
	const { name, summary } = req.body;
	if (!name) return res.status(400).json({ error: "Name required" });

	if (userId && accessToken) {
		await createCollection(accessToken, userId, name, summary);
	} else {
		console.log("User ID or access token is missing", userId, accessToken);
	}

	// Redirect to the collections page which renders the dashboard
	return res.redirect("/collections");
}

export async function list(req: Request, res: Response) {
	// @ts-expect-error
	const userId = req.user.id;
	// @ts-expect-error
	const notionConnected = !!req.user.notionAccessToken;

	const collections = await getCollectionsByUser(userId);
	return res.render("dashboard", {
		collections,
		notionConnected,
	});
}

export async function remove(req: Request, res: Response) {
	const { id } = req.params;
	const accessToken = req.user?.notionAccessToken;
	if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
	const success = await deleteCollection(accessToken, Number(id));
	if (!success) return res.status(404).json({ error: "Not found" });
	return res.redirect("/collections");
}
