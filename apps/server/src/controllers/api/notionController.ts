import { AxiosError } from "axios";
import type { Request, Response } from "express";
import { getNotionPages } from "../../services/notionService";
import { updateNotionToken } from "../../services/userService";

export async function updateToken(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		await updateNotionToken(userId, req.body);
		return res.json({ message: "Notion token updated successfully" });
	} catch (error) {
		if (error instanceof AxiosError) {
			console.log(error.response?.data);
		}

		console.error("Error updating Notion token:", error);
		return res.status(500).json({ error: "Failed to update Notion token" });
	}
}

export async function disconnect(req: Request, res: Response) {
	try {
		const userId = req.user?.id as number;
		await updateNotionToken(userId, null);
		return res.json({ message: "Disconnected from Notion successfully" });
	} catch (error) {
		if (error instanceof AxiosError) {
			console.log(error.response?.data);
		}

		console.error("Error disconnecting from Notion:", error);
		return res.status(500).json({ error: "Failed to disconnect from Notion" });
	}
}

export async function getRootPages(req: Request, res: Response) {
	const accessToken = req.user?.notionAccessToken as string;
	try {
		const pages = await getNotionPages(accessToken, true);
		return res.json(pages);
	} catch (error) {
		if (error instanceof AxiosError) {
			console.log(error.response?.data);
		}

		console.error("Error fetching Notion pages:", error);
		return res.status(500).json({ error: "Failed to fetch Notion pages" });
	}
}

export async function getPages(req: Request, res: Response) {
	const accessToken = req.user?.notionAccessToken;

	if (!accessToken) {
		return res.status(401).json({ error: "Notion not connected" });
	}

	try {
		const pages = await getNotionPages(accessToken);
		return res.json(pages);
	} catch (error) {
		console.error("Error fetching Notion pages:", error);
		return res.status(500).json({ error: "Failed to fetch Notion pages" });
	}
}
