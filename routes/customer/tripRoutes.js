import { Router } from "express";
import {
  quote,
  create,
  list,
  details,
  cancel,
  rate,
} from "../../controllers/customer/tripController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.post("/quote", authenticateClient, quote);
router.post("/", authenticateClient, create);
router.get("/", authenticateClient, list);
router.get("/:id", authenticateClient, details);
router.post("/:id/cancel", authenticateClient, cancel);
router.post("/:id/rate", authenticateClient, rate);

export default router;