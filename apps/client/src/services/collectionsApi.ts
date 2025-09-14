import type { Collection } from "@nretro/common/types";
import type {
	CreateCollectionValues,
	UpdateCollectionValues,
} from "@/schemas/collection.schema";
import { axiosApi } from "./api";

export const collectionsApi = {
	/**
	 * Get all collections
	 */
	getCollections: async () => {
		return axiosApi.get<Collection[]>("/collections");
	},

	/**
	 * Get a single collection by ID
	 */
	getCollection: async (id: Collection["id"]) => {
		return axiosApi.get<Collection>(`/collections/${id}`);
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
	updateCollection: async (
		id: Collection["id"],
		data: UpdateCollectionValues,
	) => {
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
