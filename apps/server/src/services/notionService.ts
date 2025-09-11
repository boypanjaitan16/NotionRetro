import axios from "axios";
import type { Page } from "../models/Page";

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

export async function exportCollectionToNotion(
	accessToken: string,
	databaseId: string,
	todos: any[],
) {
	const url = `${NOTION_API_BASE_URL}/pages`;
	const results = [];

	try {
		console.log(
			`Starting export to Notion database: ${databaseId} with ${todos.length} todos`,
		);

		// First, get the database structure to understand property formats
		console.log(`Fetching database structure for ${databaseId}`);
		const dbResponse = await axios.get(
			`${NOTION_API_BASE_URL}/databases/${databaseId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
				},
			},
		);

		// Get property IDs from the database
		const properties = dbResponse.data.properties;
		console.log(
			`Database properties:`,
			Object.keys(properties).map((key) => ({
				name: key,
				type: properties[key].type,
			})),
		);

		// Find title property and checkbox property
		const titleProperty =
			Object.keys(properties).find((key) => properties[key].type === "title") ||
			"Name";

		const checkboxProperty =
			Object.keys(properties).find(
				(key) => properties[key].type === "checkbox",
			) || "Completed";

		console.log(
			`Using title property: ${titleProperty}, checkbox property: ${checkboxProperty}`,
		);

		for (const todo of todos) {
			// Ensure boolean type for completed
			const isCompleted = todo.completed === 1 || todo.completed === true;

			console.log(
				`Exporting todo: "${todo.title}", completed: ${isCompleted} (original value: ${todo.completed})`,
			);

			// Create the page properties object
			const pageProperties: any = {};

			// Set the title property
			pageProperties[titleProperty] = {
				title: [{ text: { content: todo.title } }],
			};

			// Set the checkbox property
			pageProperties[checkboxProperty] = {
				checkbox: isCompleted,
			};

			const requestBody = {
				parent: { database_id: databaseId },
				properties: pageProperties,
			};

			console.log(
				`Request body for todo "${todo.title}":`,
				JSON.stringify(requestBody, null, 2),
			);

			const response = await axios.post(url, requestBody, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			});

			console.log(`Successfully added todo "${todo.title}" to Notion`);
			results.push(response.data);
		}

		console.log(`Successfully exported ${results.length} todos to Notion`);
		return results;
	} catch (error: any) {
		console.error("Error exporting to Notion:", error);

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
	summary?: string,
): Promise<boolean> {
	try {
		console.log(`Updating Notion page ${pageId} with new name/summary`);

		// First, update the page title
		await axios.patch(
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

		// Then, if there's a summary, we need to update the content blocks
		if (summary) {
			// First, get the existing blocks to find any existing summary paragraph
			const blocksResponse = await axios.get(
				`${NOTION_API_BASE_URL}/blocks/${pageId}/children`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Notion-Version": "2022-06-28",
					},
				},
			);

			const blocks = blocksResponse.data.results;
			let summaryBlockId = null;

			// Look for the first paragraph block, which we'll consider the summary
			for (const block of blocks) {
				if (block.type === "paragraph") {
					summaryBlockId = block.id;
					break;
				}
			}

			if (summaryBlockId) {
				// Update the existing summary paragraph
				await axios.patch(
					`${NOTION_API_BASE_URL}/blocks/${summaryBlockId}`,
					{
						paragraph: {
							rich_text: [
								{
									type: "text",
									text: { content: summary },
								},
							],
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
			} else {
				// Add a new summary paragraph block
				await axios.patch(
					`${NOTION_API_BASE_URL}/blocks/${pageId}/children`,
					{
						children: [
							{
								object: "block",
								type: "paragraph",
								paragraph: {
									rich_text: [
										{
											type: "text",
											text: { content: summary },
										},
									],
								},
							},
						],
					},
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Notion-Version": "2022-06-28",
							"Content-Type": "application/json",
						},
					},
				);
			}
		}

		console.log(`Successfully updated Notion page ${pageId}`);
		return true;
	} catch (error: any) {
		console.error(`Error updating Notion page ${pageId}:`, error);
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error(
				"Error response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}
		return false;
	}
}

export async function createNotionPage(
	accessToken: string,
	name: string,
	summary?: string,
) {
	try {
		console.log(`Creating Notion page with name: ${name}`);

		// Create a new page in the user's Notion workspace
		const response = await axios.post(
			`${NOTION_API_BASE_URL}/pages`,
			{
				parent: { type: "workspace", workspace: true },
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
				children: summary
					? [
							{
								object: "block",
								type: "paragraph",
								paragraph: {
									rich_text: [
										{
											type: "text",
											text: { content: summary },
										},
									],
								},
							},
						]
					: [],
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
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

export async function exportCollectionToNotionPage(
	accessToken: string,
	pageId: string,
	todos: any[],
) {
	try {
		console.log(
			`Starting export to Notion page: ${pageId} with ${todos.length} todos`,
		);

		// Create a to-do list block for each todo
		const blockChildren = [];

		// Add a header for the todos section
		blockChildren.push({
			object: "block",
			type: "heading_3",
			heading_3: {
				rich_text: [{ type: "text", text: { content: "Todos" } }],
			},
		});

		// Add a divider
		blockChildren.push({
			object: "block",
			type: "divider",
			divider: {},
		});

		// Add each todo as a checkbox item
		for (const todo of todos) {
			// Ensure boolean type for completed
			const isCompleted = todo.completed === 1 || todo.completed === true;

			console.log(
				`Exporting todo: "${todo.title}", completed: ${isCompleted} (original value: ${todo.completed})`,
			);

			blockChildren.push({
				object: "block",
				type: "to_do",
				to_do: {
					rich_text: [{ type: "text", text: { content: todo.title } }],
					checked: isCompleted,
				},
			});
		}

		// Append blocks to the page
		const response = await axios.patch(
			`${NOTION_API_BASE_URL}/blocks/${pageId}/children`,
			{
				children: blockChildren,
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

		console.log(`Successfully exported ${todos.length} todos to Notion page`);
		return response.data;
	} catch (error: any) {
		console.error("Error exporting to Notion page:", error);

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

export async function getNotionPages(accessToken: string): Promise<Page[]> {
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

		const pages = response.data.results
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
			.map((page: any) => {
				let title = "Untitled Page";
				if (
					page.properties &&
					page.properties.title &&
					page.properties.title.title
				) {
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
