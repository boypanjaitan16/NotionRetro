import { Router } from "express";
import {
	getSyncHistory,
	getSyncStatus,
	syncNotionDatabase,
} from "../../controllers/api/syncController";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

// All sync routes are protected
router.use(authenticateJWT);

// Sync routes
router.post("/notion/database", syncNotionDatabase);
router.get("/history", getSyncHistory);
router.get("/status/:syncId", getSyncStatus);

export default router;
