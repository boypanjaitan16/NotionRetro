import express from "express";
import * as activityController from "../../controllers/api/activityController";
import { authenticateJWT } from "../../middleware/authMiddleware";
import { validateNotionAuth } from "../../middleware/notionMiddleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Individual activities
router.get("/:activityId", activityController.getActivityById);
router.put("/:activityId", activityController.updateActivity);
router.delete("/:activityId", activityController.deleteActivity);
router.post(
	"/:activityId/publish",
	validateNotionAuth,
	activityController.publishActivityToNotion,
);

export default router;
