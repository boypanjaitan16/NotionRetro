import { z } from "zod";

export const createActivitySchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	summary: z.string().min(1, { message: "Summary is required" }),
	facilitator: z.string().min(1, { message: "Facilitator is required" }),
	participants: z
		.array(z.string())
		.min(1, { message: "At least one participant is required" }),
	actions: z
		.array(
			z.object({
				title: z.string().min(1, { message: "Action title is required" }),
				assignee: z.string().min(1, { message: "Assignee is required" }),
				priority: z.string().min(1, { message: "Priority is required" }),
				status: z.string().min(1, { message: "Status is required" }),
				dueDate: z.string().min(1, { message: "Due date is required" }),
			}),
		)
		.min(1, { message: "At least one action is required" }),
});

export const updateActivitySchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	summary: z.string().min(1, { message: "Summary is required" }),
	facilitator: z.string().min(1, { message: "Facilitator is required" }),
	participants: z
		.array(z.string())
		.min(1, { message: "At least one participant is required" }),
	actions: z
		.array(
			z.object({
				title: z.string().min(1, { message: "Action title is required" }),
				assignee: z.string().min(1, { message: "Assignee is required" }),
				priority: z.string().min(1, { message: "Priority is required" }),
				status: z.string().min(1, { message: "Status is required" }),
				dueDate: z.string().min(1, { message: "Due date is required" }),
			}),
		)
		.min(1, { message: "At least one action is required" }),
});

export type CreateActivityValues = z.infer<typeof createActivitySchema>;
export type UpdateActivityValues = z.infer<typeof updateActivitySchema>;
