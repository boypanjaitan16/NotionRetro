import type { Collection } from "@nretro/common/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCollectionValues } from "@/schemas/collection.schema";
import type { CollectionUpdate } from "../services/collectionsApi";
import { collectionsApi } from "../services/collectionsApi";

// Query keys for collections
export const collectionKeys = {
	all: ["collections"] as const,
	lists: () => [...collectionKeys.all, "list"] as const,
	list: (filters: string) => [...collectionKeys.lists(), { filters }] as const,
	details: () => [...collectionKeys.all, "detail"] as const,
	detail: (id: Collection["id"]) => [...collectionKeys.details(), id] as const,
};

// Hook for fetching all collections
export function useCollections() {
	return useQuery({
		queryKey: collectionKeys.lists(),
		queryFn: collectionsApi.getCollections,
	});
}

// Hook for fetching a single collection
export function useCollection(id: Collection["id"]) {
	return useQuery({
		queryKey: collectionKeys.detail(id),
		queryFn: () => collectionsApi.getCollection(id),
		enabled: !!id, // Only run if id is provided
	});
}

// Hook for creating a collection
export function useCreateCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateCollectionValues) =>
			collectionsApi.createCollection(data),
		onSuccess: () => {
			// Invalidate collections list after creating a new collection
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
		},
	});
}

// Hook for updating a collection
export function useUpdateCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: Collection["id"];
			data: CollectionUpdate;
		}) => collectionsApi.updateCollection(id, data),
		onSuccess: ({ data }) => {
			// Update both the list and the individual collection queries
			queryClient.invalidateQueries({
				queryKey: collectionKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: collectionKeys.detail(data.collection.id),
			});
		},
	});
}

// Hook for deleting a collection
export function useDeleteCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: Collection["id"]) => collectionsApi.deleteCollection(id),
		onSuccess: (_data, deletedId) => {
			// Invalidate and remove the collection from cache
			queryClient.invalidateQueries({
				queryKey: collectionKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: collectionKeys.detail(deletedId),
			});
		},
	});
}
