import { Router } from "express";
import activitiesRoutes from "./activitiyRoutes";
import authRoutes from "./authRoutes";
import collectionRoutes from "./collectionRoutes";
import notionRoutes from "./notionRoutes";

const router = Router();

// Register all API routes
router.use("/auth", authRoutes);
router.use("/collections", collectionRoutes);
router.use("/notion", notionRoutes);
router.use("/activities", activitiesRoutes);

export default router;
