import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notionApi } from "../services/notionApi";
import { collectionKeys } from "./useCollections";

// Query keys for Notion
export const notionKeys = {
	all: ["notion"] as const,
	connection: () => [...notionKeys.all, "connection"] as const,
	pages: () => [...notionKeys.all, "pages"] as const,
	databases: () => [...notionKeys.all, "databases"] as const,
};

// Hook to check if user is connected to Notion
export function useNotionConnectionStatus() {
	return useQuery({
		queryKey: notionKeys.connection(),
		queryFn: notionApi.checkConnection,
		// Refresh every 5 minutes
		staleTime: 5 * 60 * 1000,
	});
}

// Hook to get Notion OAuth URL
export function useNotionOAuthUrl() {
	return useQuery({
		queryKey: [...notionKeys.all, "oauth-url"],
		queryFn: notionApi.getOAuthUrl,
		// Don't refetch automatically since this URL shouldn't change often
		staleTime: Infinity,
	});
}

// Hook to disconnect from Notion
export function useNotionDisconnect() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: notionApi.disconnect,
		onSuccess: () => {
			// Invalidate Notion-related queries
			queryClient.invalidateQueries({ queryKey: notionKeys.all });
		},
	});
}

// Hook to get Notion pages
export function useNotionPages() {
	return useQuery({
		queryKey: notionKeys.pages(),
		queryFn: notionApi.getPages,
		// Refresh every 2 minutes
		staleTime: 2 * 60 * 1000,
	});
}

// Hook to get Notion databases
export function useNotionDatabases() {
	return useQuery({
		queryKey: notionKeys.databases(),
		queryFn: notionApi.getDatabases,
		// Refresh every 2 minutes
		staleTime: 2 * 60 * 1000,
	});
}

// Hook to sync collection to Notion
export function useSyncToNotion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			collectionId,
			databaseId,
		}: {
			collectionId: string;
			databaseId?: string;
		}) => notionApi.syncToNotion(collectionId, databaseId),
		onSuccess: (_data, { collectionId }) => {
			// Invalidate both the specific collection and Notion databases
			queryClient.invalidateQueries({
				queryKey: collectionKeys.detail(collectionId),
			});
			queryClient.invalidateQueries({ queryKey: notionKeys.databases() });
		},
	});
}

// Hook to sync from Notion to collection
export function useSyncFromNotion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			databaseId,
			collectionId,
		}: {
			databaseId: string;
			collectionId?: string;
		}) => notionApi.syncFromNotion(databaseId, collectionId),
		onSuccess: (data) => {
			// Invalidate collections and the specific collection if created/updated
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
			if (data.collectionId) {
				queryClient.invalidateQueries({
					queryKey: collectionKeys.detail(data.collectionId),
				});
			}
		},
	});
}
