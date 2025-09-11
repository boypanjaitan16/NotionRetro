import { api } from "./api";

export interface Collection {
	id: string;
	name: string;
	description: string;
	items: CollectionItem[];
}

export interface CollectionItem {
	id: string;
	content: string;
	status: string;
	notionPageId?: string;
}

export interface CollectionCreate {
	name: string;
	description?: string;
}

export interface CollectionUpdate {
	name?: string;
	description?: string;
}

export interface ItemCreate {
	content: string;
	status: string;
}

export interface ItemUpdate {
	content?: string;
	status?: string;
}

export const collectionsApi = {
	/**
	 * Get all collections
	 */
	getCollections: async () => {
		const response = await api.get<{ collections: Collection[] }>(
			"/collections",
		);
		return response.collections;
	},

	/**
	 * Get a single collection by ID
	 */
	getCollection: async (id: string) => {
		const response = await api.get<{ collection: Collection }>(
			`/collections/${id}`,
		);
		return response.collection;
	},

	/**
	 * Create a new collection
	 */
	createCollection: async (data: CollectionCreate) => {
		const response = await api.post<{
			collection: Collection;
			message: string;
		}>("/collections", data as unknown as Record<string, unknown>);
		return response.collection;
	},

	/**
	 * Update a collection
	 */
	updateCollection: async (id: string, data: CollectionUpdate) => {
		const response = await api.put<{ collection: Collection; message: string }>(
			`/collections/${id}`,
			data as unknown as Record<string, unknown>,
		);
		return response.collection;
	},

	/**
	 * Delete a collection
	 */
	deleteCollection: async (id: string) => {
		await api.delete(`/collections/${id}`);
	},
};
