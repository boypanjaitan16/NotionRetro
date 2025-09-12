/**
 * Base API service for communicating with the NotionRetro backend
 */
import axios from "axios";

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
	withCredentials: true, // Send cookies for authentication
});

axiosInstance.interceptors.request.use(
	(config) => {
		if (config.headers) config.headers.Authorization = `X`;

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
		const message = error.response?.data?.error?.message ?? error.message;
		return Promise.reject(new Error(message));
	},
);

export const axiosApi = axiosInstance;
