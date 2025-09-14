import type { Activity, Collection } from "@nretro/common/types";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type {
	CreateActivityValues,
	UpdateActivityValues,
} from "@/schemas/activity.schema";
import { activityApi } from "@/services/activityApi";

// Query keys for activities
export const activityKeys = {
	all: ["activities"] as const,
	lists: () => [...activityKeys.all, "list"] as const,
	list: (filters: string) => [...activityKeys.lists(), { filters }] as const,
	details: () => [...activityKeys.all, "detail"] as const,
	detail: (id: Collection["id"]) => [...activityKeys.details(), id] as const,
};

// Hook for fetching all activities for a collection
export function useActivities(collectionId: Collection["id"]) {
	return useSuspenseQuery({
		queryKey: activityKeys.lists(),
		queryFn: () => activityApi.getActivities(collectionId),
	});
}

// Hook for fetching a single activity
export function useActivity(id: Activity["id"]) {
	return useSuspenseQuery({
		queryKey: activityKeys.detail(id),
		queryFn: () => activityApi.getActivity(id),
	});
}

// Hook for creating a activity
export function useCreateActivity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			collectionId,
			data,
		}: {
			collectionId: Collection["id"];
			data: CreateActivityValues;
		}) => activityApi.createActivity(collectionId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
		},
	});
}

// Hook for updating a collection
export function useUpdateActivity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: Activity["id"];
			data: UpdateActivityValues;
		}) => activityApi.updateActivity(id, data),
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({
				queryKey: activityKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: activityKeys.detail(data.id),
			});
		},
	});
}

// Hook for deleting a activity
export function useDeleteActivity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: Activity["id"]) => activityApi.deleteActivity(id),
		onSuccess: (_data, deletedId) => {
			queryClient.invalidateQueries({
				queryKey: activityKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: activityKeys.detail(deletedId),
			});
		},
	});
}

export function usePublishActivityToNotion() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: Activity["id"]) => activityApi.publishActivityToNotion(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: activityKeys.lists(),
			});
		},
	});
}
