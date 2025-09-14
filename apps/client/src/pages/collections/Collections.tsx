import { Button } from "@mantine/core";
import type { Collection } from "@nretro/common/types";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useCollections, useDeleteCollection } from "@/hooks/useCollections";

const CollectionsPage = () => {
	const collections = useCollections();
	const deleteCollection = useDeleteCollection();

	const handleDelete = (id: Collection["id"]) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this collection?",
		);
		if (confirmed) {
			deleteCollection.mutateAsync(id).then(() => {
				collections.refetch();
			});
		}
	};

	return (
		<div className="py-5 md:py-12">
			<div className="flex flex-row items-center justify-between mb-5">
				<h2 className="text-2xl">Your Collections</h2>

				<Button
					component={Link}
					leftSection={<IconPlus size={15} />}
					to="/collections/new"
					color="blue"
				>
					Create Collection
				</Button>
			</div>

			<div className="flex flex-col gap-3">
				{collections.data?.data.length === 0 && (
					<div className="px-5 py-3 rounded bg-yellow-100">
						<p className="text-gray-500">
							No collections found. Create one to get started!
						</p>
					</div>
				)}
				{collections.data?.data.map((collection) => (
					<div
						key={collection.id}
						className="p-5 bg-white rounded border hover:shadow flex flex-row items-center justify-between"
					>
						<Link
							to={`/collections/${collection.id}`}
							className="text-lg font-medium text-blue-600 hover:underline"
						>
							{collection.title}
						</Link>
						<div className="flex flex-row gap-3">
							<Button
								size="xs"
								color="red"
								variant="outline"
								loading={deleteCollection.isPending}
								onClick={() => handleDelete(collection.id)}
							>
								<IconTrash size={15} />
							</Button>
							<Button
								size="xs"
								variant="outline"
								component={Link}
								to={`/collections/${collection.id}/edit`}
							>
								<IconEdit size={15} />
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default CollectionsPage;
