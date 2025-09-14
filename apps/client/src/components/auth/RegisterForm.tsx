import { Button, PasswordInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
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
	const signup = useSignup();

	const form = useForm<RegisterFormValues>({
		mode: "controlled",
		initialValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validate: zod4Resolver(registerSchema),
	});

	const handleSignup = async (data: RegisterFormValues) => {
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
				form.setErrors({ email: error.message });
			});
	};

	return (
		<form onSubmit={form.onSubmit(handleSignup)}>
			<div className="mb-4">
				<TextInput
					label="Name"
					withAsterisk
					{...form.getInputProps("name")}
					key={form.key("name")}
				/>
			</div>

			<div className="mb-4">
				<TextInput
					label="Email"
					withAsterisk
					{...form.getInputProps("email")}
					key={form.key("email")}
				/>
			</div>

			<div className="mb-4">
				<PasswordInput
					label="Password"
					withAsterisk
					{...form.getInputProps("password")}
					key={form.key("password")}
				/>
			</div>

			<div className="mb-6">
				<PasswordInput
					label="Confirm Password"
					withAsterisk
					{...form.getInputProps("confirmPassword")}
					key={form.key("confirmPassword")}
				/>
			</div>

			<Button
				fullWidth
				size="md"
				type="submit"
				loading={signup.isPending || isLoading}
				loaderProps={{
					variant: "dots",
				}}
			>
				Sign Up
			</Button>
		</form>
	);
}
