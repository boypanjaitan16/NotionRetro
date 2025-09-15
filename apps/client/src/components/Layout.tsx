import { Button, Menu } from "@mantine/core";
import classNames from "classnames";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useNotionDisconnect } from "@/hooks/useNotion";
import { handleConnectNotion } from "@/utils/notion";
import { useLogout } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";
import { NotionConnectionStatus } from "./NotionConnectionStatus";

export function Layout() {
	const { isAuthenticated, user } = useAuthStore();
	const navigate = useNavigate();
	const logout = useLogout();
	const disconnect = useNotionDisconnect();

	const handleLogout = () => {
		logout.mutate(undefined, {
			onSuccess: () => {
				navigate("/");
			},
		});
	};

	const handleConnect = () => {
		handleConnectNotion();
	};

	const handleDisconnect = () => {
		disconnect.mutateAsync().then(() => {
			console.log("Disconnected from Notion");
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
								<Link to="/" className="text-xl font-bold text-blue-500">
									NOTIONRETRO
								</Link>
							</div>
							<nav className="ml-6 flex space-x-8"></nav>
						</div>
						<div className="flex items-center">
							{isAuthenticated ? (
								<Menu trigger="hover" withArrow>
									<Menu.Target>
										<button
											type="button"
											className={classNames(
												"flex items-center flex-row gap-2 px-3 py-1.5 rounded hover:ring-1",
												{
													"ring-green-600": user?.isNotionConnected,
													"ring-red-500": !user?.isNotionConnected,
												},
											)}
										>
											<span className="font-semibold">{user?.name}</span>
											{user?.notionWorkspaceName && (
												<span className="text-sm rounded-full bg-green-600 text-white px-5 py-1">
													{user.notionWorkspaceName}
												</span>
											)}
										</button>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Item
											onClick={
												user?.isNotionConnected
													? handleDisconnect
													: handleConnect
											}
										>
											{!user?.isNotionConnected
												? "Connect to Notion"
												: "Disconnect from Notion"}
										</Menu.Item>
										<Menu.Item onClick={handleLogout}>Logout</Menu.Item>
									</Menu.Dropdown>
								</Menu>
							) : (
								<div className="flex items-center space-x-4">
									<Button component={Link} to="/login">
										Login
									</Button>
									<Button component={Link} to="/signup" variant="outline">
										Sign Up
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<NotionConnectionStatus />

			{/* Main content */}
			<main className="flex flex-col flex-grow px-5 md:px-24 lg:px-32">
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
