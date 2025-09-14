import { Router } from "express";
import { createActivity } from "../../controllers/api/activityController";
import {
	createCollection,
	deleteCollection,
	getActivitiesByCollection,
	getCollection,
	getCollections,
	updateCollection,
} from "../../controllers/api/collectionController";
import { authenticateJWT } from "../../middleware/authMiddleware";
import { validateNotionAuth } from "../../middleware/notionMiddleware";

const router = Router();

router.use(authenticateJWT);

router.get("/:id/activities", getActivitiesByCollection);
router.post("/:id/activities", validateNotionAuth, createActivity);

router.post("/", validateNotionAuth, createCollection);
router.get("/", getCollections);
router.get("/:id", getCollection);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

export default router;
