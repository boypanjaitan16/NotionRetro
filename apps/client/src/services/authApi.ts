import type { User } from "@nretro/common/types";
import type {
	LoginFormValues,
	RegisterFormValues,
} from "@/schemas/auth.schema";
import { axiosApi } from "./api";

interface AuthResponse {
	user: User;
	token: string;
	message: string;
}

export const authApi = {
	/**
	 * Log in a user
	 */
	login: async (credentials: LoginFormValues) => {
		return axiosApi.post<AuthResponse>(
			"/auth/login",
			credentials as unknown as Record<string, unknown>,
		);
	},

	/**
	 * Sign up a new user
	 */
	signup: async (credentials: RegisterFormValues) => {
		return axiosApi.post<AuthResponse>(
			"/auth/signup",
			credentials as unknown as Record<string, unknown>,
		);
	},

	/**
	 * Log out the current user
	 */
	logout: async () => {
		return axiosApi.post("/auth/logout", {} as Record<string, unknown>);
	},

	/**
	 * Get the current user
	 */
	getCurrentUser: async () => {
		return axiosApi.get<{ user: AuthResponse["user"] }>("/auth/me");
	},
};
