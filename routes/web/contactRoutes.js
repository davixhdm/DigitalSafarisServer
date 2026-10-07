import { Router } from "express";
import { submit } from "../../controllers/web/contactController.js";

const router = Router();

router.post("/", submit);

export default router;