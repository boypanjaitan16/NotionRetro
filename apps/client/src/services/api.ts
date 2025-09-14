/**
 * Base API service for communicating with the NotionRetro backend
 */

import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Create Axios instance with default configuration
 */
const axiosInstance = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	// withCredentials: true,
});

axiosInstance.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().token;
		if (config.headers) config.headers.Authorization = `Bearer ${token}`;

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		const status = error.status;
		const message = error.response?.data?.error?.message ?? error.message;

		if (status === 401) {
			useAuthStore.getState().logout();
		}

		return Promise.reject(new Error(message));
	},
);

export const axiosApi = axiosInstance;
