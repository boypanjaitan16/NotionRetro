import { Link } from "react-router-dom";

const CollectionsPage = () => {
	return (
		<div className="py-5 md:py-12">
			<div className="flex flex-row items-center justify-between">
				<h2 className="text-2xl">Your Collections</h2>

				<Link
					to="/collections/new"
					className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Add Collection
				</Link>
			</div>
		</div>
	);
};

export default CollectionsPage;
