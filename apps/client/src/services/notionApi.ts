import type { Collection, NotionPage } from "@nretro/common/types";
import { axiosApi } from "./api";

export interface NotionOAuthResponse {
	accessToken: string;
	workspaceName: string;
	workspaceIcon: string;
	botId: string;
}

export interface NotionDatabase {
	id: string;
	title: string;
	description: string;
	url: string;
}

export const notionApi = {
	/**
	 * Update Notion token
	 */
	updateNotionToken: async (data: any) => {
		return axiosApi.post<{ message: string }>("/notion/token", data);
	},

	/**
	 * Check if user is connected to Notion
	 */
	checkConnection: async () => {
		return axiosApi.get<{ connected: boolean }>("/notion/status");
	},

	/**
	 * Disconnect from Notion
	 */
	disconnect: async () => {
		await axiosApi.post<{ message: string }>(
			"/notion/disconnect",
			{} as Record<string, unknown>,
		);
	},

	/**
	 * Get all root pages
	 */
	getRootPages: async () => {
		return axiosApi.get<NotionPage[]>("/notion/root-pages");
	},

	/**
	 * Get all Notion pages
	 */
	getPages: async (parentPageId: string) => {
		return axiosApi.get<{ pages: NotionPage[] }>("/notion/pages", {
			params: { parent: parentPageId },
		});
	},

	/**
	 * Get all Notion databases
	 */
	getDatabases: async () => {
		return axiosApi.get<{ databases: NotionDatabase[] }>("/notion/databases");
	},

	/**
	 * Export collection to Notion
	 */
	exportToNotion: async (
		collectionId: Collection["id"],
		databaseId?: string,
	) => {
		return axiosApi.post<{ message: string }>("/sync/notion", {
			collectionId,
			databaseId,
		} as unknown as Record<string, unknown>);
	},
};
