import { Router } from "express";
import {
	callback,
	connect,
	createDatabase,
	createPage,
	databases,
	disconnect,
	exportToNotion,
	exportToPage,
	getPages,
} from "../controllers/notionController";
import { authenticateJWT } from "../middleware/authMiddleware";
import { validateNotionAuth } from "../middleware/notionMiddleware";

const router = Router();

router.use(authenticateJWT);

// Routes that don't require token validation
router.get("/connect", connect);
router.get("/callback", callback);

// Routes that require token validation
router.use(validateNotionAuth);
router.get("/disconnect", disconnect);
router.get("/databases", databases);
router.get("/pages", getPages);
router.post("/export", exportToNotion);
router.post("/export-to-page", exportToPage);
router.post("/create-database", createDatabase);
router.post("/create-page", createPage);

export default router;
