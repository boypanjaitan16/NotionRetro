import type { User } from "@nretro/common/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AuthState {
	token: string | null;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

interface AuthActions {
	setToken: (token: string | null) => void;
	setUser: (user: User | null) => void;
	login: (token: string, user: User) => void;
	logout: () => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
}

// Create the store with Zustand, using persist middleware to store data in localStorage
// and immer for easier state updates
export const useAuthStore = create<AuthState & AuthActions>()(
	persist(
		immer((set) => ({
			// Initial state
			token: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,

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

			login: (token, user) =>
				set((state) => {
					state.token = token;
					state.user = user;
					state.isAuthenticated = true;
					state.error = null;
				}),

			logout: () =>
				set((state) => {
					state.token = null;
					state.user = null;
					state.isAuthenticated = false;
				}),

			setLoading: (isLoading) =>
				set((state) => {
					state.isLoading = isLoading;
				}),

			setError: (error) =>
				set((state) => {
					state.error = error;
				}),

			clearError: () =>
				set((state) => {
					state.error = null;
				}),
		})),
		{
			name: "auth-storage", // Storage key in localStorage
			partialize: (state) => ({ token: state.token, user: state.user }), // Only persist these fields
		},
	),
);
