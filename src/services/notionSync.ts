import axios from "axios";
import type { Collection } from "../models/Collection";
import type { Todo } from "../models/Todo";
import { updateNotionPage } from "./notionService";

const NOTION_API_BASE_URL = process.env["NOTION_API_BASE_URL"];

export async function createNotionTodoDatabase(
	accessToken: string,
	pageId: string,
	title: string,
): Promise<{ id: string | null; success: boolean }> {
	try {
		console.log(`Creating todo database in page ${pageId}`);

		// Check if there's already a todo database in the page
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
		let existingDatabaseId: string | null = null;

		// Look for existing child database blocks
		for (const block of blocks) {
			if (block.type === "child_database") {
				existingDatabaseId = block.id;
				console.log(`Found existing database: ${existingDatabaseId}`);
				break;
			}
		}

		if (existingDatabaseId) {
			return { id: existingDatabaseId, success: true };
		}

		// Instead of using the blocks API which is causing issues,
		// let's use the databases API to create a database
		try {
			// Create a database directly using the databases endpoint
			const createResponse = await axios.post(
				`${NOTION_API_BASE_URL}/databases`,
				{
					parent: {
						type: "page_id",
						page_id: pageId,
					},
					title: [
						{
							type: "text",
							text: {
								content: `${title} Todos`,
							},
						},
					],
					properties: {
						Name: {
							title: {},
						},
						Status: {
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

			const newDatabaseId = createResponse.data.id;
			console.log(`Successfully created database with ID: ${newDatabaseId}`);
			return { id: newDatabaseId, success: true };
		} catch (dbError) {
			console.error("Error creating database:", dbError);
			if (dbError instanceof Error && "response" in dbError) {
				const axiosError = dbError as unknown as {
					response?: { status?: number; data?: any };
				};
				console.error("Error response status:", axiosError.response?.status);
				console.error(
					"Error response data:",
					JSON.stringify(axiosError.response?.data, null, 2),
				);
			}
			return { id: null, success: false };
		}
	} catch (error) {
		console.error("Error creating Notion todo database:", error);
		if (error instanceof Error && "response" in error) {
			const axiosError = error as unknown as {
				response?: { status?: number; data?: any };
			};
			console.error("Error response status:", axiosError.response?.status);
			console.error(
				"Error response data:",
				JSON.stringify(axiosError.response?.data, null, 2),
			);
		}
		return { id: null, success: false };
	}
}

export async function syncTodosWithNotionDatabase(
	accessToken: string,
	databaseId: string,
	todos: Todo[],
): Promise<boolean> {
	try {
		console.log(`Syncing ${todos.length} todos with database ${databaseId}`);

		// First, get existing entries in the database
		const queryResponse = await axios.post(
			`${NOTION_API_BASE_URL}/databases/${databaseId}/query`,
			{},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
					"Content-Type": "application/json",
				},
			},
		);

		const existingEntries = queryResponse.data.results;
		const existingTodoMap = new Map<string, { id: string }>();

		console.log("existingEntries", existingEntries);

		// Map existing entries by title for easy lookup
		existingEntries.forEach((entry: unknown) => {
			const entryObj = entry as {
				id: string;
				properties: {
					Name?: { title?: { plain_text: string }[] };
					title?: { title?: { plain_text: string }[] };
				};
			};
			const titleProperty =
				entryObj.properties.Name || entryObj.properties.title;
			if (titleProperty?.title && titleProperty.title.length > 0) {
				const title = titleProperty.title[0]?.plain_text;
				if (title) existingTodoMap.set(title, { id: entryObj.id });
			}
		});

		// Create a set of todo titles from our app for quick lookup
		const appTodoTitles = new Set(todos.map((todo) => todo.title));

		// Identify Notion entries that should be deleted (exist in Notion but not in our app)
		const toDelete: { id: string; title: string }[] = [];
		existingEntries.forEach((entry: unknown) => {
			const entryObj = entry as {
				id: string;
				properties: {
					Name?: { title?: { plain_text: string }[] };
					title?: { title?: { plain_text: string }[] };
				};
			};
			const titleProperty =
				entryObj.properties.Name || entryObj.properties.title;
			if (titleProperty?.title && titleProperty.title.length > 0) {
				const title = titleProperty.title[0]?.plain_text;
				// If the Notion entry doesn't exist in our app todos, mark for deletion
				if (title && !appTodoTitles.has(title)) {
					toDelete.push({ id: entryObj.id, title });
				}
			}
		});

		// Process each todo
		const todosRequest = [];

		// Operation counters
		let updates = 0;
		let additions = 0;
		const deletions = toDelete.length;

		// First, handle deletions
		if (toDelete.length > 0) {
			console.log(
				`Found ${toDelete.length} todos in Notion that will be deleted`,
			);

			// Add delete requests to the queue
			for (const item of toDelete) {
				todosRequest.push(
					axios.delete(`${NOTION_API_BASE_URL}/blocks/${item.id}`, {
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Notion-Version": "2022-06-28",
						},
					}),
				);
				console.log(`Queued deletion for todo: ${item.title} (${item.id})`);
			}
		} else {
			console.log("No todos need to be deleted from Notion");
		}

		// Then process updates and additions
		for (const todo of todos) {
			const todoTitle = todo.title;
			const isCompleted = todo.completed === 1;

			// Check if this todo already exists in the database
			if (existingTodoMap.has(todoTitle)) {
				const existingEntry = existingTodoMap.get(todoTitle);
				if (existingEntry) {
					// Update the existing entry
					todosRequest.push(
						axios.patch(
							`${NOTION_API_BASE_URL}/pages/${existingEntry.id}`,
							{
								properties: {
									Status: {
										checkbox: isCompleted,
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
						),
					);
					console.log(`Updated existing todo: ${todoTitle}`);
					updates++;
				}
			} else {
				// Create a new entry
				todosRequest.push(
					axios.post(
						`${NOTION_API_BASE_URL}/pages`,
						{
							parent: {
								database_id: databaseId,
							},
							properties: {
								// For new databases, the default title property is always "Name"
								Name: {
									title: [
										{
											text: {
												content: todoTitle,
											},
										},
									],
								},
								Status: {
									checkbox: isCompleted,
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
					),
				);
				console.log(`Added new todo: ${todoTitle}`);
				additions++;
			}
		}

		// Execute all requests in parallel
		try {
			await Promise.all(todosRequest);

			console.log(
				`Sync summary: ${updates} updates, ${additions} additions, ${deletions} deletions`,
			);
			console.log(`Successfully synced todos with Notion database`);
			return true;
		} catch (requestError) {
			console.error("Error executing batch operations:", requestError);
			if (requestError instanceof Error && "response" in requestError) {
				const axiosError = requestError as unknown as {
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
	} catch (error) {
		console.error("Error syncing todos with Notion database:", error);
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

export async function syncCollectionWithNotion(
	accessToken: string,
	collection: Collection,
	todos: Todo[],
): Promise<boolean> {
	try {
		console.log(
			`Syncing collection ${collection.id} with Notion page ${collection.pageId}`,
		);

		// 1. Update the page title and summary
		const pageUpdateSuccess = await updateNotionPage(
			accessToken,
			collection.pageId,
			collection.name,
			collection.summary,
		);

		if (!pageUpdateSuccess) {
			console.error("Failed to update Notion page");
			return false;
		}

		// 2. Create or get the todo database in the page
		const { id: databaseId, success: databaseSuccess } =
			await createNotionTodoDatabase(
				accessToken,
				collection.pageId,
				collection.name,
			);

		if (!databaseSuccess || !databaseId) {
			console.error("Failed to create/get todo database");
			return false;
		}

		// 3. Sync todos with the database
		const todoSyncSuccess = await syncTodosWithNotionDatabase(
			accessToken,
			databaseId,
			todos,
		);

		if (!todoSyncSuccess) {
			console.error("Failed to sync todos with database");
			return false;
		}

		console.log(`Successfully synced collection ${collection.id} with Notion`);
		return true;
	} catch (error) {
		console.error("Error syncing collection with Notion:", error);
		return false;
	}
}
