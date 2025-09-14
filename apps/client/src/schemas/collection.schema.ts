import { z } from "zod";

export const createCollectionSchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	retroParentPageId: z
		.string()
		.min(1, { message: "Retro Parent Page ID is required" }),
	retroTitleTemplate: z
		.string()
		.min(1, { message: "Retro Title Template is required" }),
	healthCheckParentPageId: z
		.string()
		.min(1, { message: "Health Check Parent Page ID is required" }),
	healthCheckTitleTemplate: z
		.string()
		.min(1, { message: "Health Check Title Template is required" }),
});

export const updateCollectionSchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	retroParentPageId: z
		.string()
		.min(1, { message: "Retro Parent Page ID is required" }),
	retroTitleTemplate: z
		.string()
		.min(1, { message: "Retro Title Template is required" }),
	healthCheckParentPageId: z
		.string()
		.min(1, { message: "Health Check Parent Page ID is required" }),
	healthCheckTitleTemplate: z
		.string()
		.min(1, { message: "Health Check Title Template is required" }),
});

export type CreateCollectionValues = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionValues = z.infer<typeof updateCollectionSchema>;
