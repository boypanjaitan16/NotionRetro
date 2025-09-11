import type { NextFunction, Request, Response } from "express";

interface ApiError extends Error {
	statusCode?: number;
	details?: Record<string, unknown>;
}

/**
 * Global error handler middleware for API errors
 */
export function errorHandler(
	err: ApiError,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	const statusCode = err.statusCode || 500;
	const message = err.message || "An unexpected error occurred";
	const details = err.details || {};

	// Log the error for server-side debugging
	console.error(`[ERROR] ${statusCode} - ${message}`, {
		details,
		stack: err.stack,
	});

	// Send error response to client
	res.status(statusCode).json({
		error: {
			message,
			...(Object.keys(details).length > 0 && { details }),
			...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
		},
	});
}
