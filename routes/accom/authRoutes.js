import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
} from "../../controllers/accom/authController.js";
import { register } from "../../controllers/accom/registerController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticateAccommodation, logout);
router.get("/me", authenticateAccommodation, me);

export default router;