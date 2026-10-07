import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
} from "../../controllers/trans/authController.js";
import { register } from "../../controllers/trans/registerController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticateTransport, logout);
router.get("/me", authenticateTransport, me);

export default router;