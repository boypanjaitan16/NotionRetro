import { Router } from "express";

// Import all API routes
import authRoutes from "./authRoutes";
import collectionRoutes from "./collectionRoutes";
import notionRoutes from "./notionRoutes";
import syncRoutes from "./syncRoutes";

const router = Router();

// Register all API routes
router.use("/auth", authRoutes);
router.use("/collections", collectionRoutes);
router.use("/notion", notionRoutes);
router.use("/sync", syncRoutes);

export default router;
