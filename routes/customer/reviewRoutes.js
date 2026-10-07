import { Router } from "express";
import {
  create,
  list,
  listForTarget,
  update,
  remove,
} from "../../controllers/customer/reviewController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.post("/", authenticateClient, create);
router.get("/", authenticateClient, list);
router.get("/target", listForTarget);
router.patch("/:id", authenticateClient, update);
router.delete("/:id", authenticateClient, remove);

export default router;