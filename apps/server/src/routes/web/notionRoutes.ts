import { Router } from "express";
import { disconnect } from "../../controllers/api/notionController";
import { callback, connect } from "../../controllers/web/notionController";
import { validateNotionAuth } from "../../middleware/notionMiddleware";

const router = Router();

// Routes that don't require token validation
router.get("/connect", connect);
router.get("/callback", callback);

// Routes that require token validation
router.use(validateNotionAuth);
router.get("/disconnect", disconnect);

export default router;
