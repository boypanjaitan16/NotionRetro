import type { NotionPage } from "@nretro/common/types";
import axios from "axios";

export interface NotionTokenResponse {
	access_token: string;
	token_type: string;
	bot_id: string;
	workspace_name: string;
	workspace_icon: string;
	workspace_id: string;
	owner?: {
		type: string;
		user?: {
			id: string;
			name: string;
			avatar_url: string;
			person?: {
				email: string;
			};
		};
	};
	duplicated_template_id?: string;
}

const NOTION_API_BASE_URL =
	process.env["NOTION_API_BASE_URL"] || "https://api.notion.com/v1";

export async function getNotionAuthUrl(
	clientId: string,
	redirectUri: string,
): Promise<string> {
	const base = `${NOTION_API_BASE_URL}/oauth/authorize`;
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		owner: "user",
		redirect_uri: redirectUri,
	});
	return `${base}?${params.toString()}`;
}

export async function exchangeCodeForToken(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string,
): Promise<NotionTokenResponse> {
	const url = `${NOTION_API_BASE_URL}/oauth/token`;
	try {
		console.log(`Exchanging code for token with redirect URI: ${redirectUri}`);
		const response = await axios.post(
			url,
			{
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
			},
			{
				auth: {
					username: clientId,
					password: clientSecret,
				},
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		console.log("Successfully exchanged code for token");
		return response.data;
	} catch (error: any) {
		console.error("Error exchanging code for token:", error);
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}
		throw error;
	}
}

export async function validateNotionToken(
	accessToken: string,
): Promise<boolean> {
	try {
		// Try to make a simple API call to verify the token is still valid
		await axios.post(
			`${NOTION_API_BASE_URL}/search`,
			{ page_size: 1 },
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			},
		);

		// If we get here, the token is valid
		return true;
	} catch (error: any) {
		// Check if error is due to authentication
		if (
			error.response &&
			(error.response.status === 401 || error.response.status === 403)
		) {
			console.log(
				"Notion token validation failed: Token is invalid or expired",
			);
			return false;
		}

		// For other errors, assume token is valid but there's some other issue
		console.error("Error validating Notion token:", error);
		return true;
	}
}

export async function isTokenExpired(
	expiresAt: Date | null | undefined,
): Promise<boolean> {
	if (!expiresAt) return false; // If no expiry set, assume not expired

	const now = new Date();
	return now > new Date(expiresAt);
}

export function getNotionTokenExpiryDate(): Date {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
	return expiresAt;
}

export async function getDatabases(accessToken: string) {
	const url = `${NOTION_API_BASE_URL}/search`;
	console.log("Fetching Notion databases...");

	try {
		const response = await axios.post(
			url,
			{
				filter: {
					value: "database",
					property: "object",
				},
				sort: {
					direction: "descending",
					timestamp: "last_edited_time",
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

		const databases = response.data.results.map((db: any) => ({
			id: db.id,
			title: db.title?.[0]?.plain_text || "Untitled Database",
			url: db.url,
		}));

		console.log(
			`Found ${databases.length} Notion databases:`,
			databases.map((db: any) => ({ id: db.id, title: db.title })),
		);

		return databases;
	} catch (error) {
		console.error("Error fetching Notion databases:", error);
		throw error;
	}
}

export async function createNotionDatabase(accessToken: string, title: string) {
	const url = `${NOTION_API_BASE_URL}/databases`;

	try {
		// First, search for a parent page to create the database in
		const response = await axios.post(
			`${NOTION_API_BASE_URL}/search`,
			{ page_size: 1, filter: { property: "object", value: "page" } },
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			},
		);

		const parentPage = response.data.results[0];
		if (!parentPage) {
			throw new Error("No parent page found to create database in");
		}

		// Create the database in the parent page
		const dbResponse = await axios.post(
			url,
			{
				parent: {
					type: "page_id",
					page_id: parentPage.id,
				},
				title: [
					{
						type: "text",
						text: {
							content: title,
						},
					},
				],
				properties: {
					Name: {
						title: {},
					},
					Completed: {
						checkbox: {},
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

		console.log(`Created database: ${dbResponse.data.id}`);

		return {
			id: dbResponse.data.id,
			title: title,
			url: dbResponse.data.url,
		};
	} catch (error: any) {
		console.error("Error creating Notion database:", error);

		// Add detailed error logging
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}

		throw error;
	}
}

export async function updateNotionPage(
	accessToken: string,
	pageId: string,
	name: string,
	children: any[] = [],
): Promise<{ id: string; title: string; url: string }> {
	try {
		console.log(`Updating Notion page ${pageId} with new name`);

		const response = await axios.patch(
			`${NOTION_API_BASE_URL}/pages/${pageId}`,
			{
				properties: {
					title: {
						title: [
							{
								text: {
									content: name,
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

		await updateNotionPageChildren(accessToken, pageId, children);

		console.log(`Successfully updated Notion page ${pageId}`);
		return {
			id: response.data.id,
			title: name,
			url: response.data.url,
		};
	} catch (error: any) {
		console.error(`Error updating Notion page ${pageId}:`, error);
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}
		throw error;
	}
}

export async function updateNotionPageChildren(
	accessToken: string,
	pageId: string,
	children: any[] = [],
): Promise<{ id: string; url: string }> {
	try {
		console.log(`Updating Notion page ${pageId} with new children`);

		const childrenBlocks = await axios.get(
			`${NOTION_API_BASE_URL}/blocks/${pageId}/children`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			},
		);

		for (const block of childrenBlocks.data?.results ?? []) {
			await axios.delete(`${NOTION_API_BASE_URL}/blocks/${block.id}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			});
		}

		const response = await axios.patch(
			`${NOTION_API_BASE_URL}/blocks/${pageId}/children`,
			{
				children,
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			},
		);

		console.log(`Successfully updated Notion page children ${pageId}`);
		return {
			id: response?.data?.id,
			url: response?.data?.url,
		};
	} catch (error: any) {
		console.error(`Error updating Notion page children ${pageId}:`, error);
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}
		throw error;
	}
}

export async function createNotionPage(
	notionAccessToken: string,
	name: string,
	parentId: string,
	children: any[] = [],
): Promise<{ id: string; title: string; url: string }> {
	try {
		console.log(`Creating Notion page with name: ${name}`);

		const response = await axios.post(
			`${NOTION_API_BASE_URL}/pages`,
			{
				parent: { type: "page_id", page_id: parentId },
				properties: {
					title: {
						title: [
							{
								text: {
									content: name,
								},
							},
						],
					},
				},
				children,
			},
			{
				headers: {
					Authorization: `Bearer ${notionAccessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			},
		);

		console.log(`Successfully created new page with ID: ${response.data.id}`);

		return {
			id: response.data.id,
			title: name,
			url: response.data.url,
		};
	} catch (error: any) {
		console.error("Error creating Notion page:", error);

		// Add detailed error logging
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}

		throw error;
	}
}

export async function getNotionPages(
	accessToken: string,
	rootPages?: boolean,
): Promise<NotionPage[]> {
	try {
		console.log("Fetching Notion pages...");

		const response = await axios.post(
			`${NOTION_API_BASE_URL}/search`,
			{
				filter: {
					property: "object",
					value: "page",
				},
				sort: {
					direction: "descending",
					timestamp: "last_edited_time",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		console.log(
			`Retrieved ${response.data.results.length} total pages from Notion`,
		);

		const pages = (
			rootPages
				? response.data.results
						// Filter to only include pages where parent.type is "workspace"
						.filter((page: any) => {
							const isWorkspacePage = page.parent?.type === "workspace";
							if (!isWorkspacePage) {
								console.log(
									`Filtering out page with parent type: ${page.parent?.type}`,
								);
							}
							return isWorkspacePage;
						})
				: response.data.results
		).map((page: any) => {
			let title = "Untitled Page";
			if (page.properties?.title?.title) {
				const titleArray = page.properties.title.title;
				if (titleArray.length > 0 && titleArray[0].plain_text) {
					title = titleArray[0].plain_text;
				}
			}

			return {
				id: page.id,
				title: title,
				url: page.url,
				parent: page.parent,
			};
		});

		console.log(
			`Found ${pages.length} Notion pages that are direct children of the workspace`,
		);

		// If no workspace pages were found, log a helpful message
		if (pages.length === 0) {
			console.log(
				"No workspace pages found. Make sure you have created pages directly in your workspace.",
			);
		}

		return pages;
	} catch (error: any) {
		console.error("Error fetching Notion pages:", error);

		// Add detailed error logging
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}

		throw error;
	}
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

export async function isPageExists(
	accessToken: string,
	pageId: string,
): Promise<boolean> {
	try {
		console.log(`Checking if Notion page ${pageId} exists`);

		await axios.get(`${NOTION_API_BASE_URL}/pages/${pageId}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Notion-Version": "2022-06-28",
			},
		});

		console.log(`Notion page ${pageId} exists`);
		return true;
	} catch (error: any) {
		if (error.response && error.response.status === 404) {
			console.log(`Notion page ${pageId} does not exist`);
			return false;
		}

		console.error(`Error checking existence of Notion page ${pageId}:`, error);
		if (error.response) {
			console.error("Error response status:", error.response.status);
		}
		throw error;
	}
}
