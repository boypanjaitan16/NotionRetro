import type { NextFunction, Request, Response } from "express";
import { isTokenExpired, validateNotionToken } from "../services/notionService";
import { updateNotionToken } from "../services/userService";

export async function validateNotionAuth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const user = req.user;

	if (!user?.notionAccessToken) {
		return res.status(500).json({
			error: {
				message: "Notion is not connected",
			},
		});
	}

	try {
		if (
			user.notionTokenExpiresAt &&
			(await isTokenExpired(user.notionTokenExpiresAt))
		) {
			console.log("Notion token has expired based on our records");
			// Clear token data
			// In a production app, you might implement a token refresh here
			await updateNotionToken(user.id, null);

			return res.status(500).json({
				error: {
					message: "Notion token has expired",
				},
			});
		}

		const isValid = await validateNotionToken(user.notionAccessToken);
		if (!isValid) {
			console.log("Notion token is invalid according to Notion API");
			// Clear token data
			await updateNotionToken(user.id, null);
			return res.status(500).json({
				error: {
					message: "Notion token has expired",
				},
			});
		}

		next();
	} catch (error) {
		console.error("Error validating Notion token:", error);
		// If there's an error, we'll assume the token might still be valid and proceed
		return next();
	}
}
