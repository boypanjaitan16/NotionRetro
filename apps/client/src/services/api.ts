/**
 * Base API service for communicating with the NotionRetro backend
 */

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Basic options for fetch requests
 */
const defaultOptions: RequestInit = {
	headers: {
		"Content-Type": "application/json",
	},
	credentials: "include", // Send cookies for authentication
};

/**
 * Generic API request function
 */
async function request<T = unknown>(
	endpoint: string,
	method: string = "GET",
	data?: Record<string, unknown>,
): Promise<T> {
	const options: RequestInit = {
		...defaultOptions,
		method,
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || `API error: ${response.status}`);
	}

	// For 204 No Content responses
	if (response.status === 204) {
		return {} as T;
	}

	return response.json();
}

/**
 * API service methods
 */
export const api = {
	/**
	 * GET request
	 */
	get: <T = unknown>(endpoint: string) => request<T>(endpoint, "GET"),

	/**
	 * POST request
	 */
	post: <T = unknown>(endpoint: string, data: Record<string, unknown>) =>
		request<T>(endpoint, "POST", data),

	/**
	 * PUT request
	 */
	put: <T = unknown>(endpoint: string, data: Record<string, unknown>) =>
		request<T>(endpoint, "PUT", data),

	/**
	 * PATCH request
	 */
	patch: <T = unknown>(endpoint: string, data: Record<string, unknown>) =>
		request<T>(endpoint, "PATCH", data),

	/**
	 * DELETE request
	 */
	delete: <T = unknown>(endpoint: string) => request<T>(endpoint, "DELETE"),
};
