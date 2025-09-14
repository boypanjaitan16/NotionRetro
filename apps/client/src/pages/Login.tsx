import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { useLogin } from "../hooks/useAuth";

export default function Login() {
	const navigate = useNavigate();
	const login = useLogin();

	const navigateToHome = () => {
		navigate("/");
	};

	return (
		<div className="flex flex-col flex-grow items-center justify-center">
			<div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
					Log in to NotionRetro
				</h2>

				<LoginForm onSuccess={navigateToHome} isLoading={login.isPending} />

				<p className="mt-4 text-center text-sm text-gray-600">
					Don't have an account?{" "}
					<Link to="/signup" className="text-blue-600 hover:text-blue-500">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
