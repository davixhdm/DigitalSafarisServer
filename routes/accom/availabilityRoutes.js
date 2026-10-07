import { Router } from "express";
import {
  list,
  setRange,
  blockDates,
  unblockDates,
} from "../../controllers/accom/availabilityController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/", authenticateAccommodation, list);
router.post("/set-range", authenticateAccommodation, setRange);
router.post("/block", authenticateAccommodation, blockDates);
router.post("/unblock", authenticateAccommodation, unblockDates);

export default router;