import { Router } from "express";
import {
  list,
  details,
  confirm,
  reject,
  checkIn,
  checkOut,
  markNoShow,
} from "../../controllers/accom/bookingController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/", authenticateAccommodation, list);
router.get("/:id", authenticateAccommodation, details);
router.post("/:id/confirm", authenticateAccommodation, confirm);
router.post("/:id/reject", authenticateAccommodation, reject);
router.post("/:id/check-in", authenticateAccommodation, checkIn);
router.post("/:id/check-out", authenticateAccommodation, checkOut);
router.post("/:id/no-show", authenticateAccommodation, markNoShow);

export default router;