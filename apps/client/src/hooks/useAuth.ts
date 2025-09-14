import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	LoginFormValues,
	RegisterFormValues,
} from "@/schemas/auth.schema";
import { authApi } from "../services/authApi";
import { useAuthStore } from "../stores/authStore";
import { collectionKeys } from "./useCollections";

// Query keys
export const authKeys = {
	all: ["auth"] as const,
	user: () => [...authKeys.all, "user"] as const,
	session: () => [...authKeys.all, "session"] as const,
};

export function useCurrentUser() {
	const { isAuthenticated } = useAuthStore();

	return useQuery({
		queryKey: authKeys.user(),
		queryFn: authApi.getCurrentUser,
		enabled: isAuthenticated,
		refetchOnWindowFocus: isAuthenticated,
		retry: 1,
	});
}

export function useLogin() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: LoginFormValues) => authApi.login(credentials),
		onSuccess: ({ data }) => {
			useAuthStore.getState().login(data.token, data.user);
			queryClient.invalidateQueries({ queryKey: authKeys.user() });
			queryClient.invalidateQueries({ queryKey: collectionKeys.all });
		},
	});
}

export function useSignup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: RegisterFormValues) =>
			authApi.signup(credentials),
		onSuccess: ({ data }) => {
			useAuthStore.getState().login(data.token, data.user);
			queryClient.invalidateQueries({ queryKey: authKeys.user() });
		},
	});
}

export function useLogout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: authApi.logout,
		onSuccess: () => {
			useAuthStore.getState().logout();
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			queryClient.setQueryData(authKeys.user(), null);
		},
	});
}
