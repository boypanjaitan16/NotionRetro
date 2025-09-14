import { Button, PasswordInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useLogin } from "@/hooks/useAuth";
import { type LoginFormValues, loginSchema } from "../../schemas/auth.schema";

interface LoginFormProps {
	onSuccess: () => void;
	isLoading?: boolean;
}

export function LoginForm({ onSuccess, isLoading = false }: LoginFormProps) {
	const login = useLogin();

	const form = useForm<LoginFormValues>({
		mode: "controlled",
		initialValues: {
			email: "",
			password: "",
		},
		validate: zod4Resolver(loginSchema),
	});

	const handleLogin = async (data: LoginFormValues) => {
		login
			.mutateAsync(data)
			.then(() => {
				onSuccess();
			})
			.catch((error) => {
				form.setErrors({ email: error.message });
			});
	};

	return (
		<form onSubmit={form.onSubmit(handleLogin)}>
			<div className="mb-4">
				<TextInput
					{...form.getInputProps("email")}
					key={form.key("email")}
					label="Email"
					withAsterisk
				/>
			</div>

			<div className="mb-6">
				<PasswordInput
					{...form.getInputProps("password")}
					key={form.key("password")}
					label="Password"
					withAsterisk
				/>
			</div>

			<Button
				type="submit"
				size="md"
				fullWidth
				loading={login.isPending || isLoading}
				loaderProps={{
					variant: "dots",
				}}
			>
				Log In
			</Button>
		</form>
	);
}
