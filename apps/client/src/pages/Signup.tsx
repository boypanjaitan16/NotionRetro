import { Link, useNavigate } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useSignup } from "../hooks/useAuth";

export default function Signup() {
	const navigate = useNavigate();
	const signup = useSignup();

	const navigateHome = async () => {
		navigate("/");
	};

	return (
		<div className="flex flex-col flex-grow items-center justify-center">
			<div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
					Create an Account
				</h2>

				<RegisterForm onSuccess={navigateHome} isLoading={signup.isPending} />

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
