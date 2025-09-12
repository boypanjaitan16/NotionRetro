import { zodResolver } from "@hookform/resolvers/zod";
import classnames from "classnames";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { useSignup } from "@/hooks/useAuth";
import {
	type RegisterFormValues,
	registerSchema,
} from "../../schemas/auth.schema";

interface RegisterFormProps {
	onSuccess: () => void;
	isLoading?: boolean;
}

export function RegisterForm({
	onSuccess,
	isLoading = false,
}: RegisterFormProps) {
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();
	const signup = useSignup();

	const {
		register,
		handleSubmit,
		setError,
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

	const handleSignup = async (data: RegisterFormValues) => {
		// Create a signup payload that omits confirmPassword
		const signupData = {
			name: data.name,
			email: data.email,
			password: data.password,
		};

		signup
			.mutateAsync(signupData)
			.then(() => {
				onSuccess();
			})
			.catch((error) => {
				setError(
					"name",
					{
						message: error.message,
					},
					{
						shouldFocus: true,
					},
				);
			});
	};

	return (
		<form onSubmit={handleSubmit(handleSignup)}>
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
					className={classnames(
						`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
						{
							"border-red-500": errors.name,
						},
					)}
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
					className={classnames(
						`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
						{
							"border-red-500": errors.email,
						},
					)}
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
					className={classnames(
						`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
						{
							"border-red-500": errors.password,
						},
					)}
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
					className={classnames(
						`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
						{
							"border-red-500": errors.confirmPassword,
						},
					)}
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
