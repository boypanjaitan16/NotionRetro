import axios from "axios";

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

export async function createNotionPage(accessToken: string, name: string) {
	try {
		console.log(`Creating new Notion page: ${name}`);

		// Create a new page in the user's workspace
		const response = await axios.post(
			`${NOTION_API_BASE_URL}/pages`,
			{
				parent: {
					type: "workspace",
					workspace: true,
				},
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
				children: [
					{
						object: "block",
						type: "heading_2",
						heading_2: {
							rich_text: [
								{ type: "text", text: { content: "Todo Collection" } },
							],
						},
					},
					{
						object: "block",
						type: "paragraph",
						paragraph: {
							rich_text: [
								{
									type: "text",
									text: { content: "Exported from NotionRetro" },
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
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
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

export async function getNotionPages(accessToken: string) {
	try {
		console.log("Fetching Notion pages...");

		const response = await axios.post(
			`${NOTION_API_BASE_URL}/search`,
			{
				filter: {
					value: "page",
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
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		const pages = response.data.results.map((page: any) => {
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
			};
		});

		console.log(`Found ${pages.length} Notion pages`);
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
