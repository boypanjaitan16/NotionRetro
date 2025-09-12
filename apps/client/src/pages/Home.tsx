import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import CollectionsPage from "./collections/Collections";

const HomePage = () => {
	const { isAuthenticated } = useAuthStore();

	if (isAuthenticated) {
		return <CollectionsPage />;
	}

	return (
		<div className="py-6 md:pt-12">
			<h1 className="font-semibold text-4xl">
				Export your Retro report into Notion
			</h1>
			<p className="mt-10 text-gray-600 mb-5">
				Your simplest way to export your retro report into Notion.
				<br />
				Create a sample retro and export the report into Notion and configure
				how you like it to display in Notion.
			</p>

			<Link
				to="/login"
				className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			>
				Login to Continue
			</Link>
		</div>
	);
};

export default HomePage;
