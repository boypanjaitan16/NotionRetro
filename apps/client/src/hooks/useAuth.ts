import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginCredentials, SignupCredentials } from "../services/authApi";
import { authApi } from "../services/authApi";
import { useAuthStore } from "../stores/authStore";

// Query keys
export const authKeys = {
	all: ["auth"] as const,
	user: () => [...authKeys.all, "user"] as const,
	session: () => [...authKeys.all, "session"] as const,
};

// Hook for getting the current user
export function useCurrentUser() {
	const { isAuthenticated } = useAuthStore();

	return useQuery({
		queryKey: authKeys.user(),
		queryFn: authApi.getCurrentUser,
		// Only fetch if user is authenticated according to local state
		enabled: isAuthenticated,
		// Don't refetch on window focus if not authenticated
		refetchOnWindowFocus: isAuthenticated,
		// Retry only once if error
		retry: 1,
	});
}

// Hook for login mutation
export function useLogin() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
		onSuccess: () => {
			// Invalidate the user query to trigger a refetch
			queryClient.invalidateQueries({ queryKey: authKeys.user() });
		},
	});
}

// Hook for signup mutation
export function useSignup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: SignupCredentials) => authApi.signup(credentials),
		onSuccess: () => {
			// Invalidate the user query to trigger a refetch
			queryClient.invalidateQueries({ queryKey: authKeys.user() });
		},
	});
}

// Hook for logout mutation
export function useLogout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: authApi.logout,
		onSuccess: () => {
			// Reset the auth-related queries after logout
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			// Clear user data from the query cache
			queryClient.setQueryData(authKeys.user(), null);
		},
	});
}
