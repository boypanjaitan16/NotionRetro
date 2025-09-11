import { Router } from "express";
import {
	authorizeNotion,
	disconnectNotion,
	getNotionDatabases,
	getNotionPages,
	notionCallback,
} from "../../controllers/api/notionController";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

// The callback route must be public for Notion to access it
router.get("/callback", notionCallback);

// All other Notion routes are protected
router.use(authenticateJWT);

// Notion routes
router.get("/authorize", authorizeNotion);
router.get("/databases", getNotionDatabases);
router.get("/pages", getNotionPages);
router.post("/disconnect", disconnectNotion);

export default router;
