import type { Activity, Collection } from "@nretro/common/types";
import type {
	CreateActivityValues,
	UpdateActivityValues,
} from "@/schemas/activity.schema";
import { axiosApi } from "./api";

export const activityApi = {
	/**
	 * Get all activities
	 */
	getActivities: async (collectionId: Collection["id"]) => {
		return axiosApi.get<Activity[]>(`/collections/${collectionId}/activities`);
	},

	/**
	 * Get a single activity by ID
	 */
	getActivity: async (id: Activity["id"]) => {
		return axiosApi.get<Activity>(`/activities/${id}`);
	},

	/**
	 * Create a new activity
	 */
	createActivity: async (
		collectionId: Collection["id"],
		data: CreateActivityValues,
	) => {
		return axiosApi.post<{
			activity: Activity;
		}>(
			`/collections/${collectionId}/activities`,
			data as unknown as Record<string, unknown>,
		);
	},

	/**
	 * Update an activity
	 */
	updateActivity: async (id: Activity["id"], data: UpdateActivityValues) => {
		return axiosApi.put<Activity>(
			`/activities/${id}`,
			data as unknown as Record<string, unknown>,
		);
	},

	/**
	 * Delete an activity
	 */
	deleteActivity: async (id: Activity["id"]) => {
		return axiosApi.delete(`/activities/${id}`);
	},

	publishActivityToNotion: async (id: Activity["id"]) => {
		return axiosApi.post<{ message: string }>(`/activities/${id}/publish`);
	},
};
