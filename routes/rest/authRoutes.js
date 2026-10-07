import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
} from "../../controllers/rest/authController.js";
import { register } from "../../controllers/rest/registerController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticateRestaurant, logout);
router.get("/me", authenticateRestaurant, me);

export default router;