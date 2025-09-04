import type { Request, Response } from "express";
import { getCollectionById } from "../services/collectionService";
import { syncCollectionWithNotion } from "../services/notionSync";
import { getTodosByCollection } from "../services/todoService";

export async function syncWithNotion(req: Request, res: Response) {
	const { collectionId } = req.params;
	const accessToken = req.user?.notionAccessToken;

	if (!accessToken) {
		return res.redirect(
			`/collections/${collectionId}/todos?error=not_connected_to_notion`,
		);
	}

	try {
		// Get the collection and its todos
		const collection = await getCollectionById(Number(collectionId));

		if (!collection) {
			return res.redirect(`/collections?error=collection_not_found`);
		}

		if (!collection.pageId) {
			return res.redirect(
				`/collections/${collectionId}/todos?error=no_notion_page_connected`,
			);
		}

		const todos = await getTodosByCollection(Number(collectionId));

		// Sync the collection with Notion
		const success = await syncCollectionWithNotion(
			accessToken,
			collection,
			todos,
		);

		if (success) {
			return res.redirect(
				`/collections/${collectionId}/todos?success=synced_with_notion`,
			);
		} else {
			return res.redirect(
				`/collections/${collectionId}/todos?error=sync_failed`,
			);
		}
	} catch (error) {
		console.error("Error syncing with Notion:", error);
		let errorMessage = "unknown_error";
		if (error instanceof Error) {
			errorMessage = encodeURIComponent(error.message);
		}
		return res.redirect(
			`/collections/${collectionId}/todos?error=sync_failed_${errorMessage}`,
		);
	}
}
