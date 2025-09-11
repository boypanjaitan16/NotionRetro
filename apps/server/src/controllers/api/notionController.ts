import axios from "axios";
import type { Request, Response } from "express";
import db from "../../utils/db";

// Notion API configuration
const NOTION_CLIENT_ID = process.env["NOTION_CLIENT_ID"];
const NOTION_CLIENT_SECRET = process.env["NOTION_CLIENT_SECRET"];
const NOTION_REDIRECT_URI =
	process.env["NOTION_REDIRECT_URI"] ||
	"http://localhost:4000/api/notion/callback";

/**
 * Authorize with Notion
 */
export async function authorizeNotion(req: Request, res: Response) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		// Check if we have the required env variables
		if (!NOTION_CLIENT_ID) {
			return res
				.status(500)
				.json({ error: { message: "Missing Notion client ID" } });
		}

		// Generate a state parameter to prevent CSRF attacks
		const state = Math.random().toString(36).substring(2, 15);

		// Store the state in the database for verification later
		await db.query("UPDATE users SET notionState = ? WHERE id = ?", [
			state,
			userId,
		]);

		// Construct the authorization URL
		const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&state=${state}&redirect_uri=${encodeURIComponent(NOTION_REDIRECT_URI)}`;

		return res.json({ authUrl });
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
		const [rows] = await db.query(
			"SELECT notionAccessToken FROM users WHERE id = ?",
			[userId],
		);

		const user = (rows as Array<{ notionAccessToken: string | null }>)[0];

		if (!user || !user.notionAccessToken) {
			return res
				.status(400)
				.json({ error: { message: "Notion not connected" } });
		}

		// Initialize axios for Notion API
		const notionApiClient = axios.create({
			baseURL: "https://api.notion.com/v1",
			headers: {
				Authorization: `Bearer ${user.notionAccessToken}`,
				"Notion-Version": "2022-06-28",
				"Content-Type": "application/json",
			},
		});

		// Get the user's databases
		const response = await notionApiClient.post("/search", {
			filter: {
				property: "object",
				value: "database",
			},
		});

		return res.json({ databases: response.data.results });
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
		const { databaseId } = req.query;

		if (!userId) {
			return res.status(401).json({ error: { message: "Not authenticated" } });
		}

		if (!databaseId) {
			return res
				.status(400)
				.json({ error: { message: "Database ID is required" } });
		}

		// Get the user's Notion access token
		const [rows] = await db.query(
			"SELECT notionAccessToken FROM users WHERE id = ?",
			[userId],
		);

		const user = (rows as Array<{ notionAccessToken: string | null }>)[0];

		if (!user || !user.notionAccessToken) {
			return res
				.status(400)
				.json({ error: { message: "Notion not connected" } });
		}

		// Initialize axios for Notion API
		const notionApiClient = axios.create({
			baseURL: "https://api.notion.com/v1",
			headers: {
				Authorization: `Bearer ${user.notionAccessToken}`,
				"Notion-Version": "2022-06-28",
				"Content-Type": "application/json",
			},
		});

		// Query the database
		const response = await notionApiClient.post(
			`/databases/${databaseId as string}/query`,
		);

		return res.json({ pages: response.data.results });
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
		await db.query(
			"UPDATE users SET notionAccessToken = NULL, notionState = NULL WHERE id = ?",
			[userId],
		);

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
		const { code, state } = req.query;

		if (!code || !state) {
			return res.status(400).json({
				error: { message: "Missing required parameters" },
			});
		}

		// Find user with matching state parameter
		const [rows] = await db.query(
			"SELECT id, notionState FROM users WHERE notionState = ?",
			[state],
		);

		const user = (rows as Array<{ id: string; notionState: string | null }>)[0];

		if (!user) {
			return res.status(400).json({
				error: { message: "Invalid state parameter" },
			});
		}

		// Exchange authorization code for access token
		try {
			const response = await axios.post(
				"https://api.notion.com/v1/oauth/token",
				{
					grant_type: "authorization_code",
					code,
					redirect_uri: NOTION_REDIRECT_URI,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
					auth: {
						username: NOTION_CLIENT_ID || "",
						password: NOTION_CLIENT_SECRET || "",
					},
				},
			);

			const { access_token, workspace_id, workspace_name } = response.data;

			// Store the access token in the database
			await db.query(
				"UPDATE users SET notionAccessToken = ?, notionWorkspaceId = ?, notionWorkspaceName = ?, notionState = NULL WHERE id = ?",
				[access_token, workspace_id, workspace_name, user.id],
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
