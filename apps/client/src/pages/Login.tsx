import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { useLogin } from "../hooks/useAuth";
import type { LoginFormValues } from "../schemas/auth.schema";

export default function Login() {
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const login = useLogin();

	const handleLogin = async (data: LoginFormValues) => {
		setError("");

		try {
			await login.mutateAsync(data);
			navigate("/collections");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		}
	};

	return (
		<div className="flex flex-col flex-grow items-center justify-center">
			<div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
					Log in to NotionRetro
				</h2>

				{error && (
					<div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
						{error}
					</div>
				)}

				<LoginForm onSubmit={handleLogin} isLoading={login.isPending} />

				<p className="mt-4 text-center text-sm text-gray-600">
					Don't have an account?{" "}
					<Link to="/signup" className="text-indigo-600 hover:text-indigo-500">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
