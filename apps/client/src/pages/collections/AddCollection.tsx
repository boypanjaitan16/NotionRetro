import { zodResolver } from "@hookform/resolvers/zod";
import classnames from "classnames";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { useCreateCollection } from "@/hooks/useCollections";
import {
	type CreateCollectionValues,
	createCollectionSchema,
} from "@/schemas/collection.schema";

const AddCollectionPage = () => {
	const titleId = useId();
	const retroParentPageIdId = useId();
	const retroTitleTemplateId = useId();
	const healthCheckParentPageIdId = useId();
	const healthCheckTitleTemplateId = useId();

	const createCollection = useCreateCollection();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<CreateCollectionValues>({
		resolver: zodResolver(createCollectionSchema),
		defaultValues: {
			title: "",
			retroParentPageId: "",
			retroTitleTemplate: "",
			healthCheckParentPageId: "",
			healthCheckTitleTemplate: "",
		},
	});

	const handleSignup = async (data: CreateCollectionValues) => {
		// Create a signup payload that omits confirmPassword
		const collectionData = {
			title: data.title,
			retroParentPageId: data.retroParentPageId,
			retroTitleTemplate: data.retroTitleTemplate,
			healthCheckParentPageId: data.healthCheckParentPageId,
			healthCheckTitleTemplate: data.healthCheckTitleTemplate,
		};

		createCollection
			.mutateAsync(collectionData)
			.then(() => {})
			.catch((error) => {
				setError(
					"title",
					{
						message: error.message,
					},
					{
						shouldFocus: true,
					},
				);
			});
	};

	return (
		<div className="py-5 md:py-12">
			<h2 className="text-2xl">Create New Collection</h2>
			<form className="mt-10 max-w-md" onSubmit={handleSubmit(handleSignup)}>
				<div className="mb-4">
					<label
						htmlFor={titleId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Title
					</label>
					<input
						id={titleId}
						type="text"
						{...register("title")}
						className={classnames(
							`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
							{
								"border-red-500": errors.title,
							},
						)}
						autoComplete="title"
					/>
					{errors.title && (
						<p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
					)}
				</div>

				<div className="mb-4">
					<label
						htmlFor={retroParentPageIdId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Retro Parent Page
					</label>
					<input
						id={retroParentPageIdId}
						type="text"
						{...register("retroParentPageId")}
						className={classnames(
							`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
							{
								"border-red-500": errors.retroParentPageId,
							},
						)}
						autoComplete="retroParentPageId"
					/>
					{errors.retroParentPageId && (
						<p className="mt-1 text-sm text-red-600">
							{errors.retroParentPageId.message}
						</p>
					)}
				</div>

				<div className="mb-4">
					<label
						htmlFor={retroTitleTemplateId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Retro Title Template
					</label>
					<input
						id={retroTitleTemplateId}
						type="text"
						{...register("retroTitleTemplate")}
						className={classnames(
							`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
							{
								"border-red-500": errors.retroTitleTemplate,
							},
						)}
						autoComplete="new-password"
					/>
					{errors.retroTitleTemplate && (
						<p className="mt-1 text-sm text-red-600">
							{errors.retroTitleTemplate.message}
						</p>
					)}
				</div>

				<div className="mb-6">
					<label
						htmlFor={healthCheckParentPageIdId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Health Check Parent Page
					</label>
					<input
						id={healthCheckParentPageIdId}
						type="text"
						{...register("healthCheckParentPageId")}
						className={classnames(
							`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
							{
								"border-red-500": errors.healthCheckParentPageId,
							},
						)}
						autoComplete="new-password"
					/>
					{errors.healthCheckParentPageId && (
						<p className="mt-1 text-sm text-red-600">
							{errors.healthCheckParentPageId.message}
						</p>
					)}
				</div>
				<div className="mb-6">
					<label
						htmlFor={healthCheckTitleTemplateId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Health Check Title Template
					</label>
					<input
						id={healthCheckTitleTemplateId}
						type="text"
						{...register("healthCheckTitleTemplate")}
						className={classnames(
							`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
							{
								"border-red-500": errors.healthCheckTitleTemplate,
							},
						)}
						autoComplete="new-password"
					/>
					{errors.healthCheckTitleTemplate && (
						<p className="mt-1 text-sm text-red-600">
							{errors.healthCheckTitleTemplate.message}
						</p>
					)}
				</div>

				<button
					type="submit"
					className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Creating collection..." : "Create Collection"}
				</button>
			</form>
		</div>
	);
};

export default AddCollectionPage;
