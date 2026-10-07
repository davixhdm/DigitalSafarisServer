import { Router } from "express";
import { listTowns } from "../../controllers/web/townsController.js";

const router = Router();

router.get("/", listTowns);

export default router;