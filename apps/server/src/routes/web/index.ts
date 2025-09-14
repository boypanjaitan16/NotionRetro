import { Router } from "express";
import notionRoutes from "./notionRoutes";

const router = Router();

router.get("/", (_req, res) => {
	res.json({
		message: "NotionRetro API Server",
		version: "1.0.0",
		documentation: "/api-docs",
	});
});

router.use("/notion", notionRoutes);

export default router;
