import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
  changePassword,
  changeEmail,
  confirmChangeEmail,
  changePhone,
  confirmChangePhone,
  deleteAccount,
} from "../../controllers/customer/authController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);

router.post("/logout", authenticateClient, logout);
router.get("/me", authenticateClient, me);
router.post("/change-password", authenticateClient, changePassword);
router.post("/change-email", authenticateClient, changeEmail);
router.post("/change-email/confirm", authenticateClient, confirmChangeEmail);
router.post("/change-phone", authenticateClient, changePhone);
router.post("/change-phone/confirm", authenticateClient, confirmChangePhone);
router.post("/delete-account", authenticateClient, deleteAccount);

export default router;