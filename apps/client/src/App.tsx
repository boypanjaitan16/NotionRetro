import type React from "react";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useCurrentUser } from "./hooks/useAuth";
import AddActivityPage from "./pages/activities/AddActivity";
import EditActivityPage from "./pages/activities/EditActivity";
import AddCollectionPage from "./pages/collections/AddCollection";
import CollectionsPage from "./pages/collections/Collections";
import DetailCollectionPage from "./pages/collections/DetailCollection";
import EditCollectionPage from "./pages/collections/EditCollection";
import HomePage from "./pages/Home";
import Login from "./pages/Login";
import NotFoundPage from "./pages/NotFound";
import Signup from "./pages/Signup";
import { useAuthStore } from "./stores/authStore";

// Protected route component
interface ProtectedRouteProps {
	element: React.ReactElement;
}

function ProtectedRoute({ element }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuthStore();

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				Loading...
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return element;
}

function App() {
	const { isAuthenticated, setUser } = useAuthStore();
	const getUser = useCurrentUser();

	useEffect(() => {
		if (isAuthenticated && getUser.isSuccess) {
			setUser(getUser.data.data.user);
		}
	}, [isAuthenticated, getUser, setUser]);

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
						path="collections/:id"
						element={<ProtectedRoute element={<DetailCollectionPage />} />}
					/>
					<Route
						path="collections/:id/edit"
						element={<ProtectedRoute element={<EditCollectionPage />} />}
					/>

					<Route
						path="collections/:id/activity"
						element={<ProtectedRoute element={<AddActivityPage />} />}
					/>
					<Route
						path="collections/:id/activity/:activityId/edit"
						element={<ProtectedRoute element={<EditActivityPage />} />}
					/>

					{/* NotFound route */}
					<Route path="*" element={<NotFoundPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
