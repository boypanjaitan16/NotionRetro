import type React from "react";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useCurrentUser } from "./hooks/useAuth";

import AddCollectionPage from "./pages/collections/AddCollection";
import CollectionsPage from "./pages/collections/Collections";
import HomePage from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuthStore } from "./stores/authStore";

const CollectionDetails = () => <div>Collection Details Page</div>;
const NotionConnect = () => <div>Notion Connect Page</div>;
const NotFound = () => <div>404 - Not Found</div>;

// Protected route component
interface ProtectedRouteProps {
	element: React.ReactElement;
}

function ProtectedRoute({ element }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuthStore();

	// If authentication is still loading, show nothing
	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				Loading...
			</div>
		);
	}

	// If not authenticated, redirect to login
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Otherwise, render the protected component
	return element;
}

function App() {
	const { isAuthenticated } = useAuthStore();
	const { refetch } = useCurrentUser();

	// Check user authentication status on app load
	useEffect(() => {
		if (isAuthenticated) {
			refetch();
		}
	}, [isAuthenticated, refetch]);

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout />}>
					{/* Public routes */}
					<Route index element={<HomePage />} />
					<Route path="login" element={<Login />} />
					<Route path="signup" element={<Signup />} />

					{/* Protected routes */}
					<Route
						path="collections"
						element={<ProtectedRoute element={<CollectionsPage />} />}
					/>
					<Route
						path="collections/new"
						element={<ProtectedRoute element={<AddCollectionPage />} />}
					/>
					<Route
						path="notion"
						element={<ProtectedRoute element={<NotionConnect />} />}
					/>

					{/* NotFound route */}
					<Route path="*" element={<NotFound />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
