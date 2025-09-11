import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { type LoginFormValues, loginSchema } from "../../schemas/auth.schema";

interface LoginFormProps {
	onSubmit: (data: LoginFormValues) => void;
	isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
	const emailId = useId();
	const passwordId = useId();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div className="mb-4">
				<label
					htmlFor={emailId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Email
				</label>
				<input
					id={emailId}
					type="email"
					{...register("email")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					autoComplete="email"
				/>
				{errors.email && (
					<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
				)}
			</div>

			<div className="mb-6">
				<label
					htmlFor={passwordId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Password
				</label>
				<input
					id={passwordId}
					type="password"
					{...register("password")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					autoComplete="current-password"
				/>
				{errors.password && (
					<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
				)}
			</div>

			<button
				type="submit"
				className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				disabled={isSubmitting || isLoading}
			>
				{isLoading ? "Logging in..." : "Log in"}
			</button>
		</form>
	);
}
