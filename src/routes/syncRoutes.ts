import { Router } from "express";
import { syncWithNotion } from "../controllers/syncController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateJWT);

router.post("/:collectionId", syncWithNotion);

export default router;
