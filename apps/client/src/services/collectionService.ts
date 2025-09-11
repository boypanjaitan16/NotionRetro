/**
 * Collection service for interacting with the collections API
 */

import type { Collection } from "../types/models";
import { api } from "./api";

/**
 * Collection service functions
 */
export const collectionService = {
	/**
	 * Get all collections for the current user
	 */
	getCollections: () => api.get<Collection[]>("/collections"),

	/**
	 * Get a collection by ID
	 */
	getCollection: (id: number) => api.get<Collection>(`/collections/${id}`),

	/**
	 * Create a new collection
	 */
	createCollection: (
		collection: Omit<
			Collection,
			"id" | "userId" | "pageId" | "createdAt" | "updatedAt"
		>,
	) => api.post<Collection>("/collections", collection),

	/**
	 * Update a collection
	 */
	updateCollection: (
		id: number,
		collection: Partial<
			Omit<Collection, "id" | "userId" | "pageId" | "createdAt" | "updatedAt">
		>,
	) => api.patch<Collection>(`/collections/${id}`, collection),

	/**
	 * Delete a collection
	 */
	deleteCollection: (id: number) => api.delete(`/collections/${id}`),

	/**
	 * Sync a collection with Notion
	 */
	syncCollection: (id: number) =>
		api.post<Collection>(`/collections/${id}/sync`, {}),
};
