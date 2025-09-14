import { Router } from "express";
import {
	disconnect,
	getRootPages,
	updateToken,
} from "../../controllers/api/notionController";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticateJWT);

router.post("/token", updateToken);
router.get("/root-pages", getRootPages);
router.post("/disconnect", disconnect);

export default router;
