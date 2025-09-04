import type { NextFunction, Request, Response } from "express";
import { isTokenExpired, validateNotionToken } from "../services/notionService";
import { updateNotionToken } from "../services/userService";

export async function validateNotionAuth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const user = req.user;

	// If no user is logged in or user has no Notion token, proceed (the controller will handle this)
	if (!user || !user.notionAccessToken) {
		return next();
	}

	try {
		// Check if token expiry date has passed
		if (
			user.notionTokenExpiresAt &&
			(await isTokenExpired(user.notionTokenExpiresAt))
		) {
			console.log("Notion token has expired based on our records");
			// Clear token data
			// In a production app, you might implement a token refresh here
			await updateNotionToken(user.id, null);
			return res.redirect("/notion/connect?error=token_expired");
		}

		// Validate token with the Notion API
		const isValid = await validateNotionToken(user.notionAccessToken);
		if (!isValid) {
			console.log("Notion token is invalid according to Notion API");
			// Clear token data
			await updateNotionToken(user.id, null);
			return res.redirect("/notion/connect?error=token_invalid");
		}

		// Token is valid, proceed
		next();
	} catch (error) {
		console.error("Error validating Notion token:", error);
		// If there's an error, we'll assume the token might still be valid and proceed
		next();
	}
}
