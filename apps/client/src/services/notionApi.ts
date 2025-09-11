import { api } from "./api";

export interface NotionOAuthResponse {
	accessToken: string;
	workspaceName: string;
	workspaceIcon: string;
	botId: string;
}

export interface NotionPage {
	id: string;
	title: string;
	url: string;
	parent: {
		type: string;
		id?: string;
	};
	created_time: string;
	last_edited_time: string;
}

export interface NotionDatabase {
	id: string;
	title: string;
	description: string;
	url: string;
}

export const notionApi = {
	/**
	 * Check if user is connected to Notion
	 */
	checkConnection: async () => {
		const response = await api.get<{ connected: boolean }>("/notion/status");
		return response.connected;
	},

	/**
	 * Get Notion OAuth URL
	 */
	getOAuthUrl: async () => {
		const response = await api.get<{ url: string }>("/notion/auth");
		return response.url;
	},

	/**
	 * Disconnect from Notion
	 */
	disconnect: async () => {
		await api.post<{ message: string }>(
			"/notion/disconnect",
			{} as Record<string, unknown>,
		);
	},

	/**
	 * Get all Notion pages
	 */
	getPages: async () => {
		const response = await api.get<{ pages: NotionPage[] }>("/notion/pages");
		return response.pages;
	},

	/**
	 * Get all Notion databases
	 */
	getDatabases: async () => {
		const response = await api.get<{ databases: NotionDatabase[] }>(
			"/notion/databases",
		);
		return response.databases;
	},

	/**
	 * Sync collection to Notion
	 */
	syncToNotion: async (collectionId: string, databaseId?: string) => {
		const response = await api.post<{ message: string }>("/sync/notion", {
			collectionId,
			databaseId,
		} as unknown as Record<string, unknown>);
		return response.message;
	},

	/**
	 * Sync from Notion to collection
	 */
	syncFromNotion: async (databaseId: string, collectionId?: string) => {
		const response = await api.post<{ message: string; collectionId: string }>(
			"/sync/notion/import",
			{
				databaseId,
				collectionId,
			} as unknown as Record<string, unknown>,
		);
		return {
			message: response.message,
			collectionId: response.collectionId,
		};
	},
};
