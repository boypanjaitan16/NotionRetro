import { useAuthStore } from "../stores/authStore";
import { api } from "./api";

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface SignupCredentials extends LoginCredentials {
	name?: string;
}

interface AuthResponse {
	user: {
		id: string;
		email: string;
		notionConnected: boolean;
	};
	token: string;
	message: string;
}

export const authApi = {
	/**
	 * Log in a user
	 */
	login: async (credentials: LoginCredentials) => {
		const response = await api.post<AuthResponse>(
			"/auth/login",
			credentials as unknown as Record<string, unknown>,
		);
		if (response.user && response.token) {
			useAuthStore.getState().login(response.token, response.user);
		}
		return response;
	},

	/**
	 * Sign up a new user
	 */
	signup: async (credentials: SignupCredentials) => {
		const response = await api.post<AuthResponse>(
			"/auth/signup",
			credentials as unknown as Record<string, unknown>,
		);
		if (response.user && response.token) {
			useAuthStore.getState().login(response.token, response.user);
		}
		return response;
	},

	/**
	 * Log out the current user
	 */
	logout: async () => {
		await api.post("/auth/logout", {} as Record<string, unknown>);
		useAuthStore.getState().logout();
	},

	/**
	 * Get the current user
	 */
	getCurrentUser: async () => {
		try {
			useAuthStore.getState().setLoading(true);
			const response = await api.get<{ user: AuthResponse["user"] }>(
				"/auth/me",
			);
			if (response.user) {
				useAuthStore.getState().setUser(response.user);
			}
			return response.user;
		} catch (error) {
			useAuthStore.getState().setError("Failed to get user data");
			throw error;
		} finally {
			useAuthStore.getState().setLoading(false);
		}
	},
};
