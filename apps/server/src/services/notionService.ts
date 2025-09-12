import axios from "axios";
import db from "../utils/db";

// Notion API configuration
const NOTION_API_BASE_URL =
	process.env["NOTION_API_BASE_URL"] || "https://api.notion.com/v1";
const NOTION_CLIENT_ID = process.env["NOTION_CLIENT_ID"];
const NOTION_CLIENT_SECRET = process.env["NOTION_CLIENT_SECRET"];
const NOTION_REDIRECT_URI =
	process.env["NOTION_REDIRECT_URI"] ||
	"http://localhost:4000/api/notion/callback";

/**
 * Store Notion state for a user
 */
export async function storeNotionState(
	userId: number,
	state: string,
): Promise<void> {
	await db.query("UPDATE users SET notionState = ? WHERE id = ?", [
		state,
		userId,
	]);
}

/**
 * Get Notion authorization URL
 */
export async function getNotionAuthorizationUrl(
	userId: number,
): Promise<string> {
	// Check if we have the required env variables
	if (!NOTION_CLIENT_ID) {
		throw new Error("Missing Notion client ID");
	}

	// Generate a state parameter to prevent CSRF attacks
	const state = Math.random().toString(36).substring(2, 15);

	// Store the state in the database for verification later
	await storeNotionState(userId, state);

	// Construct the authorization URL
	return `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&state=${state}&redirect_uri=${encodeURIComponent(NOTION_REDIRECT_URI)}`;
}

/**
 * Get user's Notion access token
 */
export async function getUserNotionToken(
	userId: number,
): Promise<string | null> {
	const [rows] = await db.query(
		"SELECT notionAccessToken FROM users WHERE id = ?",
		[userId],
	);

	const user = (rows as Array<{ notionAccessToken: string | null }>)[0];
	return user?.notionAccessToken || null;
}

/**
 * Create a Notion API client
 */
export function createNotionApiClient(accessToken: string) {
	return axios.create({
		baseURL: "https://api.notion.com/v1",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Notion-Version": "2022-06-28",
			"Content-Type": "application/json",
		},
	});
}

/**
 * Get Notion databases
 */
export async function getNotionDatabases(accessToken: string) {
	const notionApiClient = createNotionApiClient(accessToken);

	const response = await notionApiClient.post("/search", {
		filter: {
			property: "object",
			value: "database",
		},
	});

	return response.data.results;
}

/**
 * Get Notion pages
 */
export async function getNotionPagesFromDatabase(
	accessToken: string,
	databaseId: string,
) {
	const notionApiClient = createNotionApiClient(accessToken);

	const response = await notionApiClient.post(`/databases/${databaseId}/query`);

	return response.data.results;
}

/**
 * Disconnect Notion
 */
export async function disconnectNotionFromUser(userId: number): Promise<void> {
	await db.query(
		"UPDATE users SET notionAccessToken = NULL, notionState = NULL WHERE id = ?",
		[userId],
	);
}

/**
 * Find user by Notion state
 */
export async function findUserByNotionState(
	state: string,
): Promise<{ id: string; notionState: string } | null> {
	const [rows] = await db.query(
		"SELECT id, notionState FROM users WHERE notionState = ?",
		[state],
	);

	const users = rows as unknown[];
	if (users.length > 0) {
		return users[0] as { id: string; notionState: string };
	}
	return null;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeNotionCode(code: string): Promise<{
	access_token: string;
	workspace_id: string;
	workspace_name: string;
}> {
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

	return response.data;
}

/**
 * Store Notion token data for user
 */
export async function storeNotionTokenForUser(
	userId: string,
	accessToken: string,
	workspaceId: string,
	workspaceName: string,
): Promise<void> {
	await db.query(
		"UPDATE users SET notionAccessToken = ?, notionWorkspaceId = ?, notionWorkspaceName = ?, notionState = NULL WHERE id = ?",
		[accessToken, workspaceId, workspaceName, userId],
	);
}

/**
 * Removes a Notion page by its ID
 * @param accessToken The Notion API access token
 * @param pageId The ID of the page to remove
 * @returns A boolean indicating whether the operation was successful
 */
export async function removeNotionPage(
	accessToken: string,
	pageId: string,
): Promise<boolean> {
	try {
		console.log(`Attempting to remove Notion page ${pageId}`);

		// Since we can't archive workspace-level pages via API,
		// we'll try a different approach - empty the page content

		// First, check if this is a workspace-level page
		const pageInfo = await axios.get(`${NOTION_API_BASE_URL}/pages/${pageId}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Notion-Version": "2022-06-28",
			},
		});

		const isWorkspacePage =
			pageInfo.data.parent?.type === "workspace" ||
			pageInfo.data.parent?.workspace === true;

		if (isWorkspacePage) {
			console.log(
				`Page ${pageId} is a workspace-level page. Cannot archive via API.`,
			);

			// Instead of archiving, we'll get all blocks and delete them
			const blocksResponse = await axios.get(
				`${NOTION_API_BASE_URL}/blocks/${pageId}/children`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Notion-Version": "2022-06-28",
					},
				},
			);

			// Delete each block
			const deletePromises = blocksResponse.data.results.map(
				(block: { id: string }) => {
					return axios.delete(`${NOTION_API_BASE_URL}/blocks/${block.id}`, {
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Notion-Version": "2022-06-28",
						},
					});
				},
			);

			// Execute all delete requests
			if (deletePromises.length > 0) {
				await Promise.all(deletePromises);
				console.log(
					`Removed ${deletePromises.length} blocks from page ${pageId}`,
				);
			}

			// Update the page title to indicate it's been deleted
			await axios.patch(
				`${NOTION_API_BASE_URL}/pages/${pageId}`,
				{
					properties: {
						title: {
							title: [
								{
									text: {
										content:
											"[DELETED] This page was removed by NotionRetro app",
									},
								},
							],
						},
					},
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Notion-Version": "2022-06-28",
						"Content-Type": "application/json",
					},
				},
			);

			console.log(`Successfully emptied and marked page ${pageId} as deleted`);
			return true;
		} else {
			// For non-workspace pages, we can try the archive functionality
			await axios.patch(
				`${NOTION_API_BASE_URL}/pages/${pageId}`,
				{
					archived: true,
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Notion-Version": "2022-06-28",
						"Content-Type": "application/json",
					},
				},
			);

			console.log(`Successfully archived Notion page ${pageId}`);
			return true;
		}
	} catch (error) {
		console.error(`Error removing Notion page ${pageId}:`, error);
		if (error instanceof Error && "response" in error) {
			const axiosError = error as unknown as {
				response?: { status?: number; data?: unknown };
			};
			console.error("Error response status:", axiosError.response?.status);
			console.error(
				"Error response data:",
				JSON.stringify(axiosError.response?.data, null, 2),
			);
		}
		return false;
	}
}

/**
 * Check if a token expiration date has passed
 * @param expiresAt ISO date string or Date object representing the expiration time
 * @returns Boolean indicating if the token has expired
 */
export async function isTokenExpired(
	expiresAt: string | Date,
): Promise<boolean> {
	const expiryDate =
		expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
	const now = new Date();

	// If the expiration date is in the past, the token has expired
	return expiryDate < now;
}

/**
 * Validate a Notion access token by making a simple API call
 * @param accessToken The Notion access token to validate
 * @returns Boolean indicating if the token is valid
 */
export async function validateNotionToken(
	accessToken: string,
): Promise<boolean> {
	try {
		// Try a simple API call that should work with any valid token
		// We'll use the /users/me endpoint which returns the current user
		const response = await axios.get(`${NOTION_API_BASE_URL}/users/me`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Notion-Version": "2022-06-28",
			},
		});

		// If we get a successful response, the token is valid
		return response.status === 200;
	} catch (error) {
		// If we get an error, the token might be invalid
		console.error("Error validating Notion token:", error);

		// Check for specific error that indicates an invalid token
		if (error instanceof Error && "response" in error) {
			const axiosError = error as unknown as {
				response?: { status?: number; data?: unknown };
			};

			// 401 Unauthorized is the status we expect for invalid tokens
			if (axiosError.response?.status === 401) {
				return false;
			}
		}

		// For other errors, we'll rethrow to let the caller handle it
		throw error;
	}
}
