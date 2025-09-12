import { Router } from "express";
import {
	getCurrentUser,
	login,
	logout,
	signup,
} from "../../controllers/api/authController";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.use(authenticateJWT);
router.get("/me", getCurrentUser);

export default router;
