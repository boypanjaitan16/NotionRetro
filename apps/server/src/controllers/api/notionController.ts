import type { Request, Response } from "express";
import * as notionApiService from "../../services/notionService";

/**
 * Authorize with Notion
 */
export async function authorizeNotion(req: Request, res: Response) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		try {
			const authUrl = await notionApiService.getNotionAuthorizationUrl(userId);
			return res.json({ authUrl });
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Missing Notion client ID")
			) {
				return res
					.status(500)
					.json({ error: { message: "Missing Notion client ID" } });
			}
			throw error;
		}
	} catch (error) {
		console.error("Notion authorize error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to authorize with Notion" } });
	}
}

/**
 * Get Notion databases
 */
export async function getNotionDatabases(req: Request, res: Response) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// Get the user's Notion access token
		const accessToken = await notionApiService.getUserNotionToken(userId);

		if (!accessToken) {
			return res
				.status(400)
				.json({ error: { message: "Notion not connected" } });
		}

		// Get the user's databases
		const databases = await notionApiService.getNotionDatabases(accessToken);

		return res.json({ databases });
	} catch (error) {
		console.error("Get Notion databases error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to get Notion databases" } });
	}
}

/**
 * Get Notion pages
 */
export async function getNotionPages(req: Request, res: Response) {
	try {
		const userId = req.user?.id;
		const databaseId = req.query["databaseId"] as string;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!databaseId) {
			return res
				.status(400)
				.json({ error: { message: "Database ID is required" } });
		}

		// Get the user's Notion access token
		const accessToken = await notionApiService.getUserNotionToken(userId);

		if (!accessToken) {
			return res
				.status(400)
				.json({ error: { message: "Notion not connected" } });
		}

		// Query the database
		const pages = await notionApiService.getNotionPagesFromDatabase(
			accessToken,
			databaseId,
		);

		return res.json({ pages });
	} catch (error) {
		console.error("Get Notion pages error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to get Notion pages" } });
	}
}

/**
 * Disconnect Notion
 */
export async function disconnectNotion(req: Request, res: Response) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// Remove the Notion access token from the user
		await notionApiService.disconnectNotionFromUser(userId);

		return res.json({ message: "Notion disconnected successfully" });
	} catch (error) {
		console.error("Disconnect Notion error:", error);
		return res
			.status(500)
			.json({ error: { message: "Failed to disconnect Notion" } });
	}
}

/**
 * Handle Notion OAuth callback
 */
export async function notionCallback(req: Request, res: Response) {
	try {
		const code = req.query["code"] as string;
		const state = req.query["state"] as string;

		if (!code || !state) {
			return res.status(400).json({
				error: { message: "Missing required parameters" },
			});
		}

		// Find user with matching state parameter
		const user = await notionApiService.findUserByNotionState(state);

		if (!user) {
			return res.status(400).json({
				error: { message: "Invalid state parameter" },
			});
		}

		try {
			// Exchange authorization code for access token
			const { access_token, workspace_id, workspace_name } =
				await notionApiService.exchangeNotionCode(code);

			// Store the access token in the database
			await notionApiService.storeNotionTokenForUser(
				user.id,
				access_token,
				workspace_id,
				workspace_name,
			);

			// Redirect back to the frontend
			const clientRedirectUrl =
				process.env["CLIENT_URL"] || "http://localhost:3000";
			return res.redirect(`${clientRedirectUrl}/notion/success`);
		} catch (error) {
			console.error("Token exchange error:", error);
			return res.status(500).json({
				error: {
					message: "Failed to exchange authorization code for access token",
				},
			});
		}
	} catch (error) {
		console.error("Notion callback error:", error);
		return res.status(500).json({
			error: { message: "Failed to process Notion callback" },
		});
	}
}
