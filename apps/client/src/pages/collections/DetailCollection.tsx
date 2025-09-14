import { Button } from "@mantine/core";
import type { Activity } from "@nretro/common/types";
import { asInt } from "@nretro/common/utils";
import { IconEdit, IconPlus, IconSend, IconTrash } from "@tabler/icons-react";
import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { SuspenseFallback } from "@/components/SuspenseFallback";
import {
	useActivities,
	useDeleteActivity,
	usePublishActivityToNotion,
} from "@/hooks/useActivity";
import { useCollection } from "@/hooks/useCollections";

const DetailCollectionPage = () => {
	const { id } = useParams();
	const getCollection = useCollection(asInt(id));
	const getActivities = useActivities(asInt(id));
	const deleteActivity = useDeleteActivity();
	const publishActivity = usePublishActivityToNotion();

	const collection = getCollection.data?.data;
	const activities = getActivities.data?.data;

	const handleDelete = (id: Activity["id"]) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this activity?",
		);
		if (confirmed) {
			deleteActivity.mutateAsync(id).then(() => {
				getActivities.refetch();
			});
		}
	};

	const handlePublish = (id: Activity["id"]) => {
		publishActivity.mutateAsync(id).then(() => {
			alert("Activity published to Notion!");
		});
	};

	return (
		<div className="py-5 md:py-12">
			<div className="flex flex-row items-center justify-between mb-10">
				<div>
					<div className="flex flex-row items-center gap-3 mb-3">
						<Link to="/collections">
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
					<h2 className="text-2xl">{collection?.title}</h2>
				</div>

				<Button
					component={Link}
					leftSection={<IconPlus size={15} />}
					to={`/collections/${id}/activity`}
				>
					Create Activity
				</Button>
			</div>
			<div className="flex flex-col gap-3">
				{activities.length === 0 && (
					<div className="px-5 py-3 rounded bg-yellow-100">
						<p className="text-gray-500">
							No activities found. Create one to export retrospectives!
						</p>
					</div>
				)}
				{activities.map((activity) => (
					<div
						key={activity.id}
						className="px-5 py-3 bg-white border rounded hover:shadow flex flex-row items-center justify-between"
					>
						<div>
							<h4 className="font-semibold text-lg">{activity.title}</h4>
							<p className="text-sm text-gray-500">
								{activity.participants.length} participants .{" "}
								{activity.actions.length} actions
							</p>
						</div>
						<div className="flex flex-row gap-3">
							<Button
								type="button"
								color="red"
								size="xs"
								variant="outline"
								loading={deleteActivity.isPending}
								onClick={() => handleDelete(activity.id)}
							>
								<IconTrash size={15} />
							</Button>
							<Button
								component={Link}
								size="xs"
								variant="outline"
								to={`/collections/${collection.id}/activity/${activity.id}/edit`}
								className="bg-blue-100 px-3 py-1.5 rounded text-blue-500 text-sm hover:ring-1 ring-blue-500"
							>
								<IconEdit size={15} />
							</Button>
							<Button
								type="button"
								size="xs"
								loading={publishActivity.isPending}
								onClick={() => handlePublish(activity.id)}
							>
								<IconSend size={15} />
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

const SuspendedDetailCollectionPage = () => {
	return (
		<Suspense fallback={<SuspenseFallback />}>
			<DetailCollectionPage />
		</Suspense>
	);
};

export default SuspendedDetailCollectionPage;
