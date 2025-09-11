import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useSignup } from "../hooks/useAuth";
import type { RegisterFormValues } from "../schemas/auth.schema";

export default function Signup() {
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const signup = useSignup();

	const handleSignup = async (data: RegisterFormValues) => {
		setError("");

		// Create a signup payload that omits confirmPassword
		const signupData = {
			name: data.name,
			email: data.email,
			password: data.password,
		};

		try {
			await signup.mutateAsync(signupData);
			navigate("/collections");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		}
	};

	return (
		<div className="flex flex-col flex-grow items-center justify-center">
			<div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
					Create an Account
				</h2>

				{error && (
					<div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
						{error}
					</div>
				)}

				<RegisterForm onSubmit={handleSignup} isLoading={signup.isPending} />

				<p className="mt-4 text-center text-sm text-gray-600">
					Already have an account?{" "}
					<Link to="/login" className="text-indigo-600 hover:text-indigo-500">
						Log in
					</Link>
				</p>
			</div>
		</div>
	);
}
