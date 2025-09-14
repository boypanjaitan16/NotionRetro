import { Router } from "express";
import activitiesRoutes from "./activitiyRoutes";
import authRoutes from "./authRoutes";
import collectionRoutes from "./collectionRoutes";
import notionRoutes from "./notionRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/collections", collectionRoutes);
router.use("/activities", activitiesRoutes);
router.use("/notion", notionRoutes);

export default router;
