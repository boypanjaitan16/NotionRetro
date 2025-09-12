import type { Collection } from "@nretro/common/types";
import type { CreateCollectionValues } from "@/schemas/collection.schema";
import { axiosApi } from "./api";

export interface CollectionItem {
	id: string;
	content: string;
	status: string;
	notionPageId?: string;
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
		return axiosApi.get<{ collections: Collection[] }>("/collections");
	},

	/**
	 * Get a single collection by ID
	 */
	getCollection: async (id: Collection["id"]) => {
		return axiosApi.get<{ collection: Collection }>(`/collections/${id}`);
	},

	/**
	 * Create a new collection
	 */
	createCollection: async (data: CreateCollectionValues) => {
		return axiosApi.post<{
			collection: Collection;
			message: string;
		}>("/collections", data as unknown as Record<string, unknown>);
	},

	/**
	 * Update a collection
	 */
	updateCollection: async (id: Collection["id"], data: CollectionUpdate) => {
		return axiosApi.put<{ collection: Collection; message: string }>(
			`/collections/${id}`,
			data as unknown as Record<string, unknown>,
		);
	},

	/**
	 * Delete a collection
	 */
	deleteCollection: async (id: Collection["id"]) => {
		return axiosApi.delete(`/collections/${id}`);
	},
};
