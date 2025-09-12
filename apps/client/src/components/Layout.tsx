import { Link, Outlet, useNavigate } from "react-router-dom";
import { useLogout } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

export function Layout() {
	const { isAuthenticated, user } = useAuthStore();
	const navigate = useNavigate();
	const logout = useLogout();

	const handleLogout = () => {
		logout.mutate(undefined, {
			onSuccess: () => {
				navigate("/");
			},
		});
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			{/* Header */}
			<header className="bg-white shadow-sm">
				<div className="mx-auto px-5 md:px-24 lg:px-32">
					<div className="flex justify-between h-16">
						<div className="flex">
							<div className="flex-shrink-0 flex items-center">
								<Link to="/" className="text-xl font-bold text-indigo-600">
									NotionRetro
								</Link>
							</div>
							<nav className="ml-6 flex space-x-8"></nav>
						</div>
						<div className="flex items-center">
							{isAuthenticated ? (
								<div className="flex items-center space-x-4">
									<span className="text-sm text-gray-500">{user?.name}</span>
									<button
										type="button"
										onClick={handleLogout}
										className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
									>
										Logout
									</button>
								</div>
							) : (
								<div className="flex items-center space-x-4">
									<Link
										to="/login"
										className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
									>
										Login
									</Link>
									<Link
										to="/signup"
										className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
									>
										Sign Up
									</Link>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="flex flex-col flex-grow md:px-24 lg:px-32">
				<Outlet />
			</main>

			{/* Footer */}
			<footer className="bg-white border-t border-gray-200">
				<div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
					<p className="text-center text-sm text-gray-500">
						&copy; {new Date().getFullYear()} NotionRetro. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
