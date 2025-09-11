import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import {
	type RegisterFormValues,
	registerSchema,
} from "../../schemas/auth.schema";

interface RegisterFormProps {
	onSubmit: (data: RegisterFormValues) => void;
	isLoading?: boolean;
}

export function RegisterForm({
	onSubmit,
	isLoading = false,
}: RegisterFormProps) {
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div className="mb-4">
				<label
					htmlFor={nameId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Name
				</label>
				<input
					id={nameId}
					type="text"
					{...register("name")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					autoComplete="name"
				/>
				{errors.name && (
					<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
				)}
			</div>

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

			<div className="mb-4">
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
					autoComplete="new-password"
				/>
				{errors.password && (
					<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
				)}
			</div>

			<div className="mb-6">
				<label
					htmlFor={confirmPasswordId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Confirm Password
				</label>
				<input
					id={confirmPasswordId}
					type="password"
					{...register("confirmPassword")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					autoComplete="new-password"
				/>
				{errors.confirmPassword && (
					<p className="mt-1 text-sm text-red-600">
						{errors.confirmPassword.message}
					</p>
				)}
			</div>

			<button
				type="submit"
				className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				disabled={isSubmitting || isLoading}
			>
				{isLoading ? "Creating account..." : "Sign up"}
			</button>
		</form>
	);
}
