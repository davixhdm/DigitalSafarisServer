import { Router } from "express";
import publicRoutes from "./public/index.js";
import webRoutes from "./web/index.js";
import adminRoutes from "./admin/index.js";
import customerRoutes from "./customer/index.js";
import restaurantRoutes from "./rest/index.js";
import accommodationRoutes from "./accom/index.js";
import transportRoutes from "./trans/index.js";

const router = Router();

router.use("/public", publicRoutes);
router.use("/web", webRoutes);
router.use("/admin", adminRoutes);
router.use("/customer", customerRoutes);
router.use("/restaurant", restaurantRoutes);
router.use("/accommodation", accommodationRoutes);
router.use("/transport", transportRoutes);

export default router;