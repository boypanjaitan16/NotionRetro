import { Button, Select, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { asInt } from "@nretro/common/utils";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SuspenseFallback } from "@/components/SuspenseFallback";
import { useCollection, useUpdateCollection } from "@/hooks/useCollections";
import { useNotionRootPages } from "@/hooks/useNotion";
import {
	type UpdateCollectionValues,
	updateCollectionSchema,
} from "@/schemas/collection.schema";

const EditCollectionPage = () => {
	const { id } = useParams<{ id: string }>();
	const getCollection = useCollection(asInt(id));
	const collection = getCollection.data?.data;

	const navigate = useNavigate();

	const updateCollection = useUpdateCollection();
	const rootPages = useNotionRootPages();

	const form = useForm<UpdateCollectionValues>({
		mode: "uncontrolled",
		initialValues: collection,
		validate: zod4Resolver(updateCollectionSchema),
	});

	const handleUpdate = async (data: UpdateCollectionValues) => {
		const collectionData = {
			title: data.title,
			retroParentPageId: data.retroParentPageId,
			retroTitleTemplate: data.retroTitleTemplate,
			healthCheckParentPageId: data.healthCheckParentPageId,
			healthCheckTitleTemplate: data.healthCheckTitleTemplate,
		};

		updateCollection
			.mutateAsync({
				id: parseInt(id || "0", 10),
				data: collectionData,
			})
			.then(() => {
				navigate("/collections");
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
					<span className="text-gray-500">Collections</span>
				</div>
				<h2 className="text-2xl">Update Collection</h2>
			</div>
			<form className="mt-10" onSubmit={form.onSubmit(handleUpdate)}>
				<div className="mb-4">
					<TextInput
						{...form.getInputProps("title")}
						key={form.key("title")}
						withAsterisk
						label="Title"
						autoComplete="title"
					/>
				</div>

				<div className="mb-4">
					<Select
						{...form.getInputProps("retroParentPageId")}
						key={form.key("retroParentPageId")}
						withAsterisk
						label="Retro Parent Page"
						data={rootPages.data?.data.map((page) => ({
							value: page.id,
							label: page.title,
						}))}
					/>
				</div>

				<div className="mb-4">
					<TextInput
						{...form.getInputProps("retroTitleTemplate")}
						key={form.key("retroTitleTemplate")}
						withAsterisk
						label="Retro Title Template"
						error={form.errors.retroTitleTemplate}
					/>
				</div>

				<div className="mb-6">
					<Select
						{...form.getInputProps("healthCheckParentPageId")}
						key={form.key("healthCheckParentPageId")}
						withAsterisk
						label="Health Check Parent Page"
						data={rootPages.data?.data.map((page) => ({
							value: page.id,
							label: page.title,
						}))}
					/>
				</div>
				<div className="mb-6">
					<TextInput
						{...form.getInputProps("healthCheckTitleTemplate")}
						key={form.key("healthCheckTitleTemplate")}
						withAsterisk
						label="Health Check Title Template"
					/>
				</div>

				<Button
					type="submit"
					fullWidth
					disabled={updateCollection.isPending}
					loading={updateCollection.isPending}
					loaderProps={{ type: "dots" }}
				>
					{"Update Collection"}
				</Button>
			</form>
		</div>
	);
};

const SuspendedEditCollectionPage = () => {
	return (
		<Suspense fallback={<SuspenseFallback />}>
			<EditCollectionPage />
		</Suspense>
	);
};

export default SuspendedEditCollectionPage;
