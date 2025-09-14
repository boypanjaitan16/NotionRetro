import type { Request, Response } from "express";
import {
	exchangeCodeForToken,
	getNotionAuthUrl,
} from "../../services/notionService";

const NOTION_CLIENT_ID = process.env["NOTION_CLIENT_ID"] || "";
const NOTION_CLIENT_SECRET = process.env["NOTION_CLIENT_SECRET"] || "";
const NOTION_REDIRECT_URI = process.env["NOTION_REDIRECT_URI"] || "";
const APP_FRONTEND_URL =
	process.env["APP_FRONTEND_URL"] || "http://localhost:3000";

export async function connect(req: Request, res: Response) {
	const token = req.query["token"] as string;
	const url = await getNotionAuthUrl(NOTION_CLIENT_ID, NOTION_REDIRECT_URI);

	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env["NODE_ENV"] === "production",
		sameSite: "strict",
		maxAge: 24 * 60 * 60 * 1000,
	});
	res.redirect(url);
}

export async function callback(req: Request, res: Response) {
	const code = req.query["code"] as string;
	if (!code) return res.status(400).json({ error: "Missing code" });

	try {
		const tokenResponse = await exchangeCodeForToken(
			code,
			NOTION_CLIENT_ID,
			NOTION_CLIENT_SECRET,
			NOTION_REDIRECT_URI,
		);

		console.log(tokenResponse);

		return res.render("callback", {
			status: "success",
			data: tokenResponse,
			targetUrl: APP_FRONTEND_URL,
		});
	} catch (error) {
		console.error("Error exchanging code for token:", error);
		return res.render("callback", { status: "error" });
	}
}
