/** biome-ignore-all lint/suspicious/noArrayIndexKey: ok> */
import {
	Button,
	Fieldset,
	MultiSelect,
	Select,
	Textarea,
	TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { asInt } from "@nretro/common/utils";
import { IconPlus } from "@tabler/icons-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { Link, useNavigate, useParams } from "react-router-dom";
import { groupmapMembers } from "@/constants/groupmapMember";
import { useCreateActivity } from "@/hooks/useActivity";
import {
	type CreateActivityValues,
	createActivitySchema,
} from "@/schemas/activity.schema";

const AddActivityPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const createActivity = useCreateActivity();

	const form = useForm<CreateActivityValues>({
		mode: "controlled",
		initialValues: {
			title: "",
			summary: "",
			facilitator: "",
			participants: [],
			actions: [
				{
					title: "",
					assignee: "",
					priority: "",
					dueDate: "",
					status: "INPROGRESS",
				},
			],
		},
		validate: zod4Resolver(createActivitySchema),
	});

	const handleCreate = async (data: CreateActivityValues) => {
		const activityData = {
			title: data.title,
			summary: data.summary,
			facilitator: data.facilitator,
			participants: data.participants,
			actions: data.actions,
		};

		createActivity
			.mutateAsync({
				collectionId: asInt(id),
				data: activityData,
			})
			.then(() => {
				navigate(`/collections/${id}`);
			})
			.catch((error) => {
				form.setErrors({
					title: error.message,
				});
			});
	};

	return (
		<div className="py-5 md:py-12">
			<div>
				<div className="flex flex-row items-center gap-3 mb-3">
					<Link to={`/collections/${id}`}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
							className="size-5"
						>
							<title>Back to Collections</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
							/>
						</svg>
					</Link>
					<span className="text-gray-500">Collection</span>
				</div>
				<h2 className="text-2xl">Create New Activity</h2>
			</div>
			<form className="mt-10" onSubmit={form.onSubmit(handleCreate)}>
				<div className="mb-4">
					<TextInput
						{...form.getInputProps("title")}
						key={form.key("title")}
						label="Title"
						withAsterisk
					/>
				</div>

				<div className="mb-6">
					<Textarea
						{...form.getInputProps("summary")}
						key={form.key("summary")}
						label="Summary"
						withAsterisk
					/>
				</div>

				<div className="mb-6">
					<Select
						{...form.getInputProps("facilitator")}
						key={form.key("facilitator")}
						withAsterisk
						label="Facilitator"
						data={groupmapMembers}
					/>
				</div>

				<div className="mb-6">
					<MultiSelect
						{...form.getInputProps("participants")}
						key={form.key("participants")}
						withAsterisk
						label="Participants"
						data={groupmapMembers}
					/>
				</div>

				<div className="mb-6">
					<Fieldset legend="Actions">
						<div className="flex flex-col gap-3">
							{form.values.actions.map((_, index) => (
								<div key={`action-${index}`} className="grid grid-cols-5 gap-4">
									<TextInput
										{...form.getInputProps(`actions.${index}.title`)}
										key={form.key(`actions.${index}.title`)}
										label="Title"
										withAsterisk
									/>
									<Select
										{...form.getInputProps(`actions.${index}.assignee`)}
										key={form.key(`actions.${index}.assignee`)}
										withAsterisk
										label="Assignee"
										data={groupmapMembers}
									/>
									<Select
										{...form.getInputProps(`actions.${index}.priority`)}
										key={form.key(`actions.${index}.priority`)}
										withAsterisk
										label="Priority"
										data={[
											{ value: "Low", label: "Low" },
											{ value: "Medium", label: "Medium" },
											{ value: "High", label: "High" },
										]}
									/>
									<Select
										{...form.getInputProps(`actions.${index}.status`)}
										key={form.key(`actions.${index}.status`)}
										withAsterisk
										label="Status"
										data={[
											{ value: "INPROGRESS", label: "In Progress" },
											{ value: "COMPLETED", label: "Completed" },
										]}
										defaultValue="INPROGRESS"
									/>
									<div className="flex flex-row gap-3">
										<DateInput
											{...form.getInputProps(`actions.${index}.dueDate`)}
											key={form.key(`actions.${index}.dueDate`)}
											label="Due Date"
											withAsterisk
											placeholder="Select date"
											className="w-full"
										/>
										{form.values.actions.length > 1 && (
											<div className="flex items-start pt-6 justify-end">
												<Button
													color="red"
													onClick={() => {
														const newActions = form.values.actions.filter(
															(_, i) => i !== index,
														);
														form.setFieldValue("actions", newActions);
													}}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
														stroke="currentColor"
														className="size-4"
													>
														<title>Delete</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
														/>
													</svg>
												</Button>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
						<div className={"mt-5"}>
							<Button
								fullWidth={form.values.actions.length > 0}
								variant="outline"
								size="xs"
								leftSection={<IconPlus size={15} />}
								onClick={() => {
									console.log(form.values);
									form.setFieldValue("actions", [
										...form.values.actions,
										{
											title: "",
											assignee: "",
											priority: "",
											dueDate: "",
											status: "INPROGRESS",
										},
									]);
								}}
							>
								{form.values.actions.length === 0
									? "Add Action"
									: "Add Another Action"}
							</Button>
						</div>
					</Fieldset>
				</div>

				<Button
					type="submit"
					fullWidth
					loading={createActivity.isPending}
					loaderProps={{
						type: "dots",
					}}
				>
					Create Activity
				</Button>
			</form>
		</div>
	);
};

export default AddActivityPage;
