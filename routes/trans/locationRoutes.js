import { Router } from "express";
import {
  get,
  ping,
  setAvailability,
} from "../../controllers/trans/locationController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.get("/", authenticateTransport, get);
router.post("/ping", authenticateTransport, ping);
router.post("/availability", authenticateTransport, setAvailability);

export default router;