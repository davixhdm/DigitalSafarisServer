import { Router } from "express";
import {
  list,
  create,
  update,
  remove,
  setDefault,
} from "../../controllers/customer/addressController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.get("/", authenticateClient, list);
router.post("/", authenticateClient, create);
router.patch("/:id", authenticateClient, update);
router.delete("/:id", authenticateClient, remove);
router.post("/:id/default", authenticateClient, setDefault);

export default router;