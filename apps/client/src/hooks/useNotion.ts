import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notionApi } from "../services/notionApi";
import { authKeys } from "./useAuth";

export const notionKeys = {
	all: ["notion"] as const,
	connection: () => [...notionKeys.all, "connection"] as const,
	pages: () => [...notionKeys.all, "pages"] as const,
	rootPages: () => [...notionKeys.all, "root-pages"] as const,
	databases: () => [...notionKeys.all, "databases"] as const,
};

export function useUpdateNotionToken() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: notionApi.updateNotionToken,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.user() });
		},
	});
}

export function useNotionDisconnect() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: notionApi.disconnect,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.user() });
		},
	});
}

export function useNotionRootPages() {
	return useQuery({
		queryKey: notionKeys.rootPages(),
		queryFn: notionApi.getRootPages,
		staleTime: 2 * 60 * 1000,
	});
}

export function useNotionPages(parentPageId: string) {
	return useQuery({
		queryKey: notionKeys.pages(),
		queryFn: () => notionApi.getPages(parentPageId),
		staleTime: 2 * 60 * 1000,
	});
}
