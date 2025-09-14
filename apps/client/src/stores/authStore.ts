import type { User } from "@nretro/common/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AuthState {
	token: string | null;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface AuthActions {
	setToken: (token: string | null) => void;
	setUser: (user: User | null) => void;
	setLoading: (isLoading: boolean) => void;

	login: (token: string, user: User) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
	persist(
		immer((set) => ({
			token: null,
			user: null,
			isNotionConnected: false,
			isAuthenticated: false,
			isLoading: false,

			// Actions
			setToken: (token) =>
				set((state) => {
					state.token = token;
					state.isAuthenticated = !!token;
				}),

			setUser: (user) =>
				set((state) => {
					state.user = user;
				}),

			setLoading: (isLoading) =>
				set((state) => {
					state.isLoading = isLoading;
				}),

			login: (token, user) =>
				set((state) => {
					state.token = token;
					state.user = user;
					state.isAuthenticated = true;
				}),

			logout: () =>
				set((state) => {
					state.token = null;
					state.user = null;
					state.isAuthenticated = false;
				}),
		})),
		{
			name: "auth-storage", // Storage key in localStorage
		},
	),
);
