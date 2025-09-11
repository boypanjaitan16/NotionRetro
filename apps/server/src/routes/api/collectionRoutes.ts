import { Router } from "express";
import {
	createCollection,
	deleteCollection,
	getCollection,
	getCollections,
	updateCollection,
} from "../../controllers/api/collectionController";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

// All collection routes are protected
router.use(authenticateJWT);

// Collection routes
router.post("/", createCollection);
router.get("/", getCollections);
router.get("/:id", getCollection);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

export default router;
