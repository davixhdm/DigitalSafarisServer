import { Router } from "express";
import {
  list,
  details,
  create,
  update,
  remove,
  setDefault,
} from "../../controllers/trans/vehicleController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.get("/", authenticateTransport, list);
router.get("/:id", authenticateTransport, details);
router.post("/", authenticateTransport, create);
router.patch("/:id", authenticateTransport, update);
router.delete("/:id", authenticateTransport, remove);
router.post("/:id/default", authenticateTransport, setDefault);

export default router;