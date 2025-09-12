import express from "express";
import * as activityController from "../../controllers/api/activityController";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Individual activities
router.get("/activities/:activityId", activityController.getActivityById);
router.put("/activities/:activityId", activityController.updateActivity);
router.delete("/activities/:activityId", activityController.deleteActivity);

// Actions within activities
router.post(
	"/activities/:activityId/actions",
	activityController.addActionToActivity,
);
router.put(
	"/activities/:activityId/actions/:actionIndex",
	activityController.updateActionInActivity,
);
router.delete(
	"/activities/:activityId/actions/:actionIndex",
	activityController.removeActionFromActivity,
);

export default router;
